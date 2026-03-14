/**
 * 更新楼盘拼音首字母脚本
 * 运行: npx tsx scripts/update-estate-pinyin.ts
 */
import { pinyin } from 'pinyin-pro'
import { db } from '../server/lib/db'
import { estates } from '../server/lib/schema'

async function updatePinyin() {
  const allEstates = await db.select({ id: estates.id, name: estates.name }).from(estates)
  console.log(`共 ${allEstates.length} 个楼盘需要更新拼音`)
  
  for (const estate of allEstates) {
    const py = pinyin(estate.name, { pattern: 'first', toneType: 'none', separator: '' }).toUpperCase()
    await db.update(estates).set({ pinyin: py } as any).where(require('drizzle-orm').eq(estates.id, estate.id))
    console.log(`${estate.name} → ${py}`)
  }
  console.log('拼音更新完成！')
  process.exit(0)
}

updatePinyin().catch(console.error)
