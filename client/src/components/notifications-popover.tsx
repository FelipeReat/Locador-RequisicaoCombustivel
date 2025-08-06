import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, Check, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { FuelRequisition } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface NotificationItem {
  id: string;
  type: "new_requisition" | "pending_approval" | "status_change";
  title: string;
  description: string;
  time: string;
  requisitionId?: number;
  priority?: "low" | "medium" | "high" | "urgent";
  isRead?: boolean;
}

const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Agora mesmo";
  if (diffMins < 60) return `${diffMins}m atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  return `${diffDays}d atrás`;
};

export function NotificationsPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const [readNotifications, setReadNotifications] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('read-notifications');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (error) {
      console.error("Erro ao carregar notificações lidas do localStorage:", error);
      return new Set();
    }
  });

  const { data: requisitions } = useQuery<FuelRequisition[]>({
    queryKey: ["/api/fuel-requisitions"],
  });

  const generateNotifications = (): NotificationItem[] => {
    if (!requisitions) return [];

    const notifications: NotificationItem[] = [];
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    requisitions.forEach(req => {
      const createdAt = new Date(req.createdAt);

      if (createdAt > oneDayAgo) {
        const notificationId = `new_${req.id}_${createdAt.getTime()}`;
        const isRecent = createdAt > oneHourAgo;

        notifications.push({
          id: notificationId,
          type: "new_requisition",
          title: "Nova Requisição",
          description: `REQ${String(req.id).padStart(3, "0")} - ${req.client}`,
          time: formatTimeAgo(createdAt),
          requisitionId: req.id,
          priority: req.priority as any,
          isRead: readNotifications.has(notificationId) || !isRecent,
        });
      }

      if (req.status === "pending") {
        const notificationId = `pending_${req.id}_${req.status}`;
        notifications.push({
          id: notificationId,
          type: "pending_approval",
          title: "Aguardando Aprovação",
          description: `REQ${String(req.id).padStart(3, "0")} - ${req.client}`,
          time: formatTimeAgo(createdAt),
          requisitionId: req.id,
          priority: req.priority as any,
          isRead: readNotifications.has(notificationId),
        });
      }

      if (req.approvedDate && new Date(req.approvedDate) > oneDayAgo) {
        const approvedDate = new Date(req.approvedDate);
        const notificationId = `status_${req.id}_${req.status}_${approvedDate.getTime()}`;
        const isRecent = approvedDate > oneHourAgo;

        notifications.push({
          id: notificationId,
          type: "status_change",
          title: req.status === "approved" ? "Requisição Aprovada" : "Status Alterado",
          description: `REQ${String(req.id).padStart(3, "0")} - ${req.client}`,
          time: formatTimeAgo(approvedDate),
          requisitionId: req.id,
          priority: req.priority as any,
          isRead: readNotifications.has(notificationId) || !isRecent,
        });
      }
    });

    return notifications.sort((a, b) => {
      if (a.isRead !== b.isRead) {
        return a.isRead ? 1 : -1;
      }
      return new Date(b.time).getTime() - new Date(a.time).getTime();
    });
  };

  const notifications = generateNotifications();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    const clearOldNotifications = () => {
      try {
        const saved = localStorage.getItem('read-notifications');
        if (!saved) return;

        const readNotifications = JSON.parse(saved);
        if (Array.isArray(readNotifications) && readNotifications.length > 50) {
          const recent = readNotifications.slice(-25);
          localStorage.setItem('read-notifications', JSON.stringify(recent));
        }
      } catch (error) {
        localStorage.removeItem('read-notifications');
      }
    };

    if (notifications.length > 0) {
      clearOldNotifications();
    }
  }, [notifications.length]);

  const markAllAsRead = () => {
    const allNotificationIds = new Set(notifications.map(n => n.id));
    setReadNotifications(allNotificationIds);
    try {
      localStorage.setItem('read-notifications', JSON.stringify(Array.from(allNotificationIds)));
    } catch (error) {
      console.error("Erro ao salvar todas as notificações como lidas:", error);
    }
  };

  const markAsRead = (notificationId: string) => {
    const newReadNotifications = new Set(readNotifications);
    newReadNotifications.add(notificationId);
    setReadNotifications(newReadNotifications);
    try {
      localStorage.setItem('read-notifications', JSON.stringify(Array.from(newReadNotifications)));
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      localStorage.setItem('read-notifications', JSON.stringify([notificationId]));
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "new_requisition":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "pending_approval":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "status_change":
        return <Check className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-primary transition-colors"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Notificações
            </h3>
            <Badge variant="secondary" className="text-xs">
              {notifications.length}
            </Badge>
          </div>
        </div>

        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Nenhuma notificação no momento
              </p>
            </div>
          ) : (
            <div className="p-2">
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <div
                    className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors ${!notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                    onClick={() => !notification.isRead && markAsRead(notification.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1 relative">
                        {getNotificationIcon(notification.type)}
                        {!notification.isRead && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium truncate ${!notification.isRead ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-700 dark:text-gray-200'}`}>
                            {notification.title}
                          </p>
                          {notification.priority && (
                            <Badge
                              variant="secondary"
                              className={`text-xs ml-2 ${getPriorityColor(notification.priority)}`}
                            >
                              {notification.priority}
                            </Badge>
                          )}
                        </div>
                        <p className={`text-sm truncate ${!notification.isRead ? 'text-gray-700 dark:text-gray-200' : 'text-gray-600 dark:text-gray-300'}`}>
                          {notification.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {notification.time}
                        </p>
                      </div>
                    </div>
                  </div>
                  {index < notifications.length - 1 && (
                    <Separator className="my-1" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="p-3 border-t">
            <Button
              variant="ghost"
              className="w-full text-sm"
              onClick={markAllAsRead}
            >
              Marcar todas como lidas
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}