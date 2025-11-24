import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import {
  Building2,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  Users,
  Calendar,
  FlaskRound,
  Pill,
  Settings,
  Check
} from 'lucide-react';
import { Button } from '../ui/Button';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  createdAt: string;
}

export function Navbar() {
  const { profile, signOut } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (profile?._id) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [profile?._id]);

  const fetchNotifications = async () => {
    if (!profile?._id) return;

    try {
      const data = (await api.getNotifications()) as Notification[];
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.is_read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await api.markNotificationAsRead(notificationId);
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!profile?._id) return;

    try {
      await api.markAllNotificationsAsRead();
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getRoleIcon = () => {
    switch (profile?.role) {
      case 'patient':
        return <User size={20} />;
      case 'doctor':
        return <Users size={20} />;
      case 'lab_technician':
        return <FlaskRound size={20} />;
      case 'pharmacist':
        return <Pill size={20} />;
      case 'admin':
        return <Settings size={20} />;
      case 'nurse':
        return <User size={20} />;
      default:
        return <User size={20} />;
    }
  };

  const getRoleLabel = () => {
    switch (profile?.role) {
      case 'patient':
        return 'Patient';
      case 'doctor':
        return 'Doctor';
      case 'lab_technician':
        return 'Lab Technician';
      case 'pharmacist':
        return 'Pharmacist';
      case 'admin':
        return 'Administrator';
        case 'nurse':
        return 'Nurse';
      default:
        return 'User';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <Calendar size={18} className="text-blue-600" />;
      case 'lab_test':
        return <FlaskRound size={18} className="text-purple-600" />;
      case 'prescription':
        return <Pill size={18} className="text-green-600" />;
      default:
        return <Bell size={18} className="text-gray-600" />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="bg-emerald-600 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
              <Building2 size={20} className="sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">EasyHealth</h1>
              <p className="text-xs text-gray-600 truncate">{getRoleLabel()} Portal</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <div className="relative">
              <button
                className="relative p-2 text-gray-600 hover:text-emerald-600 transition-colors"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={22} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Bell size={48} className="mx-auto mb-2 opacity-20" />
                      <p>No notifications yet</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {notifications.map((notification) => (
                        <div
                          key={notification._id}
                          className={`p-4 hover:bg-gray-50 transition-colors ${
                            !notification.is_read ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-medium text-gray-900">
                                  {notification.title}
                                </p>
                                {!notification.is_read && (
                                  <button
                                    onClick={() => markAsRead(notification._id)}
                                    className="text-emerald-600 hover:text-emerald-700"
                                    title="Mark as read"
                                  >
                                    <Check size={16} />
                                  </button>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatTime(notification.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 bg-gray-50 rounded-lg min-w-0">
              <div className="text-emerald-600 flex-shrink-0">{getRoleIcon()}</div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{profile?.full_name}</p>
                <p className="text-xs text-gray-600 truncate hidden sm:block">{profile?.email}</p>
              </div>
            </div>

            <Button variant="danger" size="sm" onClick={signOut}>
              <LogOut size={16} className="mr-1" />
              Logout
            </Button>
          </div>

          <button
            className="md:hidden text-gray-600"
            onClick={() => setShowMenu(!showMenu)}
          >
            {showMenu ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {showMenu && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 space-y-3">
            <button
              className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg text-left"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <div className="flex items-center gap-2">
                <Bell size={20} className="text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Notifications</span>
              </div>
              {unreadCount > 0 && (
                <span className="flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 rounded-full">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="bg-white rounded-lg border border-gray-200 max-h-64 overflow-y-auto">
                <div className="p-3 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <Bell size={32} className="mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications.map((notification) => (
                      <div
                        key={notification._id}
                        className={`p-3 ${!notification.is_read ? 'bg-blue-50' : ''}`}
                      >
                        <div className="flex items-start gap-2">
                          <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium text-gray-900">
                                {notification.title}
                              </p>
                              {!notification.is_read && (
                                <button
                                  onClick={() => markAsRead(notification._id)}
                                  className="text-emerald-600"
                                  title="Mark as read"
                                >
                                  <Check size={14} />
                                </button>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatTime(notification.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 sm:gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="text-emerald-600 flex-shrink-0">{getRoleIcon()}</div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 break-words">{profile?.full_name}</p>
                <p className="text-xs text-gray-600 break-words">{profile?.email}</p>
              </div>
            </div>
            <Button variant="danger" size="sm" fullWidth onClick={signOut}>
              <LogOut size={16} className="mr-1" />
              Logout
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
