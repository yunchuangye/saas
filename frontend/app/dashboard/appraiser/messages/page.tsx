"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Send, PenSquare } from "lucide-react"

const conversations = [
  {
    id: 1,
    name: "中国银行朝阳支行",
    avatar: "中行",
    lastMessage: "请问报告什么时候可以完成？",
    time: "10:30",
    unread: 2,
  },
  {
    id: 2,
    name: "工商银行海淀支行",
    avatar: "工行",
    lastMessage: "收到，我们会尽快处理",
    time: "昨天",
    unread: 0,
  },
  {
    id: 3,
    name: "建设银行西城支行",
    avatar: "建行",
    lastMessage: "报告已收到，非常感谢",
    time: "昨天",
    unread: 0,
  },
  {
    id: 4,
    name: "系统管理员",
    avatar: "管理",
    lastMessage: "您的账户信息已更新",
    time: "3天前",
    unread: 0,
  },
]

const messages = [
  {
    id: 1,
    sender: "中国银行朝阳支行",
    content: "您好，关于朝阳区CBD商业综合体评估项目，我们想了解一下进度",
    time: "10:15",
    isMe: false,
  },
  {
    id: 2,
    sender: "我",
    content: "您好，目前项目进度约75%，预计明天可以完成初稿",
    time: "10:20",
    isMe: true,
  },
  {
    id: 3,
    sender: "中国银行朝阳支行",
    content: "好的，请问报告什么时候可以完成？",
    time: "10:30",
    isMe: false,
  },
]

export default function AppraiserMessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState(conversations[0])
  const [newMessage, setNewMessage] = useState("")
  const [messageList, setMessageList] = useState(messages)
  const [isNewMessageDialogOpen, setIsNewMessageDialogOpen] = useState(false)
  const [newRecipient, setNewRecipient] = useState("")
  const [newMessageContent, setNewMessageContent] = useState("")

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      setMessageList(prev => [...prev, {
        id: prev.length + 1,
        sender: "我",
        content: newMessage,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        isMe: true,
      }])
      setNewMessage("")
    }
  }

  const handleNewConversation = () => {
    if (newRecipient && newMessageContent.trim()) {
      alert(`已发送消息给: ${newRecipient}\n内容: ${newMessageContent}`)
      setIsNewMessageDialogOpen(false)
      setNewRecipient("")
      setNewMessageContent("")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">消息中心</h1>
          <p className="text-muted-foreground">与银行和客户沟通交流</p>
        </div>
        <Button onClick={() => setIsNewMessageDialogOpen(true)}>
          <PenSquare className="mr-2 h-4 w-4" />
          新消息
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3 h-[600px]">
        {/* 会话列表 */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="搜索会话..." className="pl-8" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`flex items-center gap-3 p-4 cursor-pointer transition-colors hover:bg-accent ${
                    selectedConversation.id === conversation.id ? "bg-accent" : ""
                  }`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <Avatar>
                    <AvatarFallback className="text-xs">{conversation.avatar}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate">{conversation.name}</p>
                      <span className="text-xs text-muted-foreground">{conversation.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{conversation.lastMessage}</p>
                  </div>
                  {conversation.unread > 0 && (
                    <Badge className="bg-info text-info-foreground">{conversation.unread}</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 消息详情 */}
        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader className="border-b">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback className="text-xs">{selectedConversation.avatar}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{selectedConversation.name}</CardTitle>
                <CardDescription>在线</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto p-4">
            <div className="space-y-4">
              {messageList.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      message.isMe
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${message.isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {message.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <div className="border-t p-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="输入消息..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1"
              />
              <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* 新消息对话框 */}
      <Dialog open={isNewMessageDialogOpen} onOpenChange={setIsNewMessageDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>发起新对话</DialogTitle>
            <DialogDescription>选择联系人并发送消息</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="recipient">收件人</Label>
              <Select value={newRecipient} onValueChange={setNewRecipient}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择联系人" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="中国银行朝阳支行">中国银行朝阳支行</SelectItem>
                  <SelectItem value="工商银行海淀支行">工商银行海淀支行</SelectItem>
                  <SelectItem value="建设银行西城支行">建设银行西城支行</SelectItem>
                  <SelectItem value="农业银行通州支行">农业银行通州支行</SelectItem>
                  <SelectItem value="系统管理员">系统管理员</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message-content">消息内容</Label>
              <Textarea
                id="message-content"
                placeholder="请输入消息内容"
                value={newMessageContent}
                onChange={(e) => setNewMessageContent(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsNewMessageDialogOpen(false)
              setNewRecipient("")
              setNewMessageContent("")
            }}>
              取消
            </Button>
            <Button onClick={handleNewConversation} disabled={!newRecipient || !newMessageContent.trim()}>
              <Send className="mr-2 h-4 w-4" />
              发送
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
