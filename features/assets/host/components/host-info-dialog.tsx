'use client';

import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/shared/ui/dialog';
import { HostInfoCard } from './host-info-card';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

export function HostInfoDialog({
  node,
  children,
}: {
  node: any;
  children: React.ReactNode;
}) {
  if (!node || node.type !== 'host') return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        {/* 由调用者传入触发按钮 */}
        {children}
      </DialogTrigger>

      <DialogContent className="max-w-md w-full p-0 m-0 border-none shadow-xl">
        {/* 隐藏标题用于无障碍但不占用视觉空间 */}
        <DialogTitle className="p-0 m-0 h-0 overflow-hidden">
          <VisuallyHidden>主机信息</VisuallyHidden>
        </DialogTitle>

        {/* 主机信息卡片内容 */}
        <HostInfoCard node={node} className="m-0 p-0 border-none" reserveCloseSpace />
      </DialogContent>
    </Dialog>
  );
}
