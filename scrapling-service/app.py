"""
Scrapling 采集微服务 - Flask HTTP API
提供给 Node.js 后端调用的 REST API 接口
端口: 8722
"""
import os
import sys
import threading
import traceback
from datetime import datetime

from flask import Flask, request, jsonify
from dotenv import load_dotenv

# 添加当前目录到 Python 路径
sys.path.insert(0, os.path.dirname(__file__))

# 加载环境变量
load_dotenv(os.path.join(os.path.dirname(__file__), '../backend/.env'))

from spiders.job_executor import execute_job
from utils.db import get_job, write_log, update_job_status

app = Flask(__name__)

# 正在运行的任务（job_id -> thread）
running_jobs: dict[int, threading.Thread] = {}
running_jobs_lock = threading.Lock()


def run_job_in_thread(job_id: int):
    """在独立线程中执行采集任务"""
    try:
        execute_job(job_id)
    except Exception as e:
        error_msg = str(e)
        tb = traceback.format_exc()
        try:
            write_log(job_id, 'error', f'任务异常终止: {error_msg}')
            update_job_status(job_id, 'failed',
                              error_message=error_msg[:500],
                              completed_at=datetime.now())
        except Exception:
            pass
    finally:
        with running_jobs_lock:
            running_jobs.pop(job_id, None)


# ─── API 路由 ──────────────────────────────────────────────────────────────────

@app.route('/health', methods=['GET'])
def health():
    """健康检查"""
    return jsonify({
        'status': 'ok',
        'service': 'scrapling-service',
        'running_jobs': len(running_jobs),
        'timestamp': datetime.now().isoformat(),
    })


@app.route('/job/start', methods=['POST'])
def start_job():
    """
    启动采集任务
    Body: { "job_id": 1 }
    """
    data = request.get_json()
    if not data or 'job_id' not in data:
        return jsonify({'error': '缺少 job_id 参数'}), 400

    job_id = int(data['job_id'])

    # 检查任务是否存在
    job = get_job(job_id)
    if not job:
        return jsonify({'error': f'任务 {job_id} 不存在'}), 404

    # 检查是否已在运行
    with running_jobs_lock:
        if job_id in running_jobs and running_jobs[job_id].is_alive():
            return jsonify({'error': f'任务 {job_id} 已在运行中'}), 409

        # 启动新线程
        thread = threading.Thread(
            target=run_job_in_thread,
            args=(job_id,),
            daemon=True,
            name=f'scrapling-job-{job_id}'
        )
        running_jobs[job_id] = thread
        thread.start()

    return jsonify({
        'message': f'任务 {job_id} 已启动',
        'job_id': job_id,
        'thread': thread.name,
    })


@app.route('/job/stop', methods=['POST'])
def stop_job():
    """
    停止采集任务（标记为暂停，线程会在下次检查时退出）
    Body: { "job_id": 1 }
    """
    data = request.get_json()
    if not data or 'job_id' not in data:
        return jsonify({'error': '缺少 job_id 参数'}), 400

    job_id = int(data['job_id'])

    with running_jobs_lock:
        thread = running_jobs.get(job_id)
        if not thread or not thread.is_alive():
            return jsonify({'message': f'任务 {job_id} 未在运行'}), 200

    # 更新数据库状态为暂停（线程会检查并退出）
    try:
        update_job_status(job_id, 'paused')
        write_log(job_id, 'info', '任务已被手动停止')
    except Exception as e:
        return jsonify({'error': str(e)}), 500

    return jsonify({'message': f'任务 {job_id} 已发送停止信号'})


@app.route('/job/status', methods=['GET'])
def job_status():
    """
    查询任务运行状态
    Query: ?job_id=1
    """
    job_id = request.args.get('job_id')
    if not job_id:
        return jsonify({'error': '缺少 job_id 参数'}), 400

    job_id = int(job_id)
    job = get_job(job_id)
    if not job:
        return jsonify({'error': f'任务 {job_id} 不存在'}), 404

    with running_jobs_lock:
        is_running = job_id in running_jobs and running_jobs[job_id].is_alive()

    return jsonify({
        'job_id': job_id,
        'status': job.get('status'),
        'progress': job.get('progress', 0),
        'success_count': job.get('success_count', 0),
        'fail_count': job.get('fail_count', 0),
        'duplicate_count': job.get('duplicate_count', 0),
        'is_running_in_thread': is_running,
    })


@app.route('/jobs/running', methods=['GET'])
def running_jobs_list():
    """查询所有正在运行的任务"""
    with running_jobs_lock:
        jobs = [
            {'job_id': jid, 'thread': t.name, 'alive': t.is_alive()}
            for jid, t in running_jobs.items()
        ]
    return jsonify({'running_jobs': jobs, 'count': len(jobs)})


@app.route('/test/parse', methods=['POST'])
def test_parse():
    """
    测试解析器（调试用）
    Body: { "html": "...", "source": "lianjia", "data_type": "sold_cases",
            "city_name": "深圳", "city_id": 6, "url": "..." }
    """
    data = request.get_json()
    if not data:
        return jsonify({'error': '缺少请求体'}), 400

    from parsers.lianjia_parser import parse_lianjia_sold_list, parse_lianjia_listing_list
    from parsers.anjuke_parser import parse_anjuke_sold_list
    from parsers.general_parser import parse_fang_sold_list

    source = data.get('source', 'lianjia')
    data_type = data.get('data_type', 'sold_cases')
    html = data.get('html', '')
    city_name = data.get('city_name', '深圳')
    city_id = data.get('city_id', 6)
    url = data.get('url', '')

    parser_map = {
        ('lianjia', 'sold_cases'): parse_lianjia_sold_list,
        ('lianjia', 'listing'): parse_lianjia_listing_list,
        ('anjuke', 'sold_cases'): parse_anjuke_sold_list,
        ('fang', 'sold_cases'): parse_fang_sold_list,
    }

    parser = parser_map.get((source, data_type))
    if not parser:
        return jsonify({'error': f'不支持的组合: {source}/{data_type}'}), 400

    try:
        results = parser(html, city_name, city_id, url)
        return jsonify({'count': len(results), 'items': results[:5]})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    port = int(os.getenv('SCRAPLING_PORT', 8722))
    print(f'[Scrapling Service] 启动在端口 {port}')
    app.run(host='0.0.0.0', port=port, debug=False, threaded=True)
