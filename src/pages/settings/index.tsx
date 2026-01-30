import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input, Label } from '@/components/ui'

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>基础设置</CardTitle>
          <CardDescription>配置 API 代理的基本参数</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="port">监听端口</Label>
              <Input id="port" type="number" placeholder="8080" defaultValue="8080" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="host">监听地址</Label>
              <Input id="host" placeholder="0.0.0.0" defaultValue="0.0.0.0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeout">请求超时 (秒)</Label>
              <Input id="timeout" type="number" placeholder="30" defaultValue="30" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxRetries">最大重试次数</Label>
              <Input id="maxRetries" type="number" placeholder="3" defaultValue="3" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>日志设置</CardTitle>
          <CardDescription>配置日志记录选项</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="logLevel">日志级别</Label>
              <Input id="logLevel" placeholder="info" defaultValue="info" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logPath">日志路径</Label>
              <Input id="logPath" placeholder="./logs" defaultValue="./logs" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline">重置</Button>
        <Button>保存设置</Button>
      </div>
    </div>
  )
}
