import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import Auth from './Auth';

type Tab = 'chats' | 'calls' | 'contacts' | 'profile' | 'settings';

interface Chat {
  id: number;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  encrypted: boolean;
  avatar: string;
}

interface Call {
  id: number;
  name: string;
  type: 'incoming' | 'outgoing' | 'missed';
  time: string;
  duration?: string;
  avatar: string;
}

const mockChats: Chat[] = [
  { id: 1, name: 'Анонимный #4782', lastMessage: 'Сообщение зашифровано end-to-end', time: '12:45', unread: 3, encrypted: true, avatar: 'A4' },
  { id: 2, name: 'Анонимный #8932', lastMessage: 'Привет! Как дела?', time: '11:20', unread: 0, encrypted: true, avatar: 'A8' },
  { id: 3, name: 'Анонимный #2341', lastMessage: 'Отлично, спасибо!', time: 'Вчера', unread: 1, encrypted: true, avatar: 'A2' },
  { id: 4, name: 'Анонимный #9871', lastMessage: 'Встретимся завтра?', time: '2 дня назад', unread: 0, encrypted: true, avatar: 'A9' },
];

const mockCalls: Call[] = [
  { id: 1, name: 'Анонимный #4782', type: 'incoming', time: 'Сегодня 14:30', duration: '15:43', avatar: 'A4' },
  { id: 2, name: 'Анонимный #8932', type: 'outgoing', time: 'Вчера 18:22', duration: '05:12', avatar: 'A8' },
  { id: 3, name: 'Анонимный #2341', type: 'missed', time: '3 дня назад', avatar: 'A2' },
];

export default function Index() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [anonymousId, setAnonymousId] = useState<string>('');
  const [sessionToken, setSessionToken] = useState<string>('');
  const [activeTab, setActiveTab] = useState<Tab>('chats');
  const [selectedChat, setSelectedChat] = useState<number | null>(1);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const storedToken = localStorage.getItem('session_token');
    const storedUserId = localStorage.getItem('user_id');
    const storedAnonymousId = localStorage.getItem('anonymous_id');

    if (storedToken && storedUserId && storedAnonymousId) {
      setSessionToken(storedToken);
      setUserId(parseInt(storedUserId));
      setAnonymousId(storedAnonymousId);
      setIsAuthenticated(true);
    }
  }, []);

  const handleAuthSuccess = (newUserId: number, newAnonymousId: string, newSessionToken: string) => {
    setUserId(newUserId);
    setAnonymousId(newAnonymousId);
    setSessionToken(newSessionToken);
    setIsAuthenticated(true);
    localStorage.setItem('session_token', newSessionToken);
    localStorage.setItem('user_id', newUserId.toString());
    localStorage.setItem('anonymous_id', newAnonymousId);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserId(null);
    setAnonymousId('');
    setSessionToken('');
    localStorage.removeItem('session_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('anonymous_id');
  };

  if (!isAuthenticated) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  const renderChatList = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Чаты</h2>
          <Button size="icon" variant="ghost">
            <Icon name="Plus" size={20} />
          </Button>
        </div>
        <Input 
          placeholder="Поиск чатов..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-muted border-border"
        />
      </div>
      <ScrollArea className="flex-1">
        {mockChats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => setSelectedChat(chat.id)}
            className={`flex items-center gap-3 p-4 cursor-pointer transition-colors hover:bg-muted ${
              selectedChat === chat.id ? 'bg-muted' : ''
            }`}
          >
            <Avatar>
              <AvatarFallback className="bg-primary text-primary-foreground">{chat.avatar}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium truncate">{chat.name}</span>
                <span className="text-xs text-muted-foreground">{chat.time}</span>
              </div>
              <div className="flex items-center gap-2">
                {chat.encrypted && <Icon name="Lock" size={12} className="text-primary flex-shrink-0" />}
                <p className="text-sm text-muted-foreground truncate flex-1">{chat.lastMessage}</p>
                {chat.unread > 0 && (
                  <Badge className="bg-primary text-primary-foreground">{chat.unread}</Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </ScrollArea>
    </div>
  );

  const renderChatWindow = () => {
    const chat = mockChats.find(c => c.id === selectedChat);
    if (!chat) return null;

    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 p-4 border-b border-border bg-card">
          <Avatar>
            <AvatarFallback className="bg-primary text-primary-foreground">{chat.avatar}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-medium">{chat.name}</h3>
            <div className="flex items-center gap-1 text-xs text-primary">
              <Icon name="Shield" size={12} />
              <span>Защищено E2E шифрованием</span>
            </div>
          </div>
          <Button size="icon" variant="ghost">
            <Icon name="Phone" size={20} />
          </Button>
          <Button size="icon" variant="ghost">
            <Icon name="Video" size={20} />
          </Button>
          <Button size="icon" variant="ghost">
            <Icon name="MoreVertical" size={20} />
          </Button>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                Сегодня
              </div>
            </div>
            <div className="flex gap-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">{chat.avatar}</AvatarFallback>
              </Avatar>
              <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-2 max-w-[70%]">
                <p className="text-sm">Привет! Как дела?</p>
                <span className="text-xs text-muted-foreground">10:30</span>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2 max-w-[70%]">
                <p className="text-sm">Отлично! Спасибо за вопрос 😊</p>
                <span className="text-xs opacity-80">10:32</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">{chat.avatar}</AvatarFallback>
              </Avatar>
              <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-2 max-w-[70%]">
                <p className="text-sm">Хочу обсудить важную тему. У тебя есть время?</p>
                <span className="text-xs text-muted-foreground">12:45</span>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost">
              <Icon name="Paperclip" size={20} />
            </Button>
            <Input 
              placeholder="Сообщение зашифровано..." 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 bg-muted border-border"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  setMessage('');
                }
              }}
            />
            <Button size="icon">
              <Icon name="Send" size={20} />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderCalls = () => (
    <div className="flex flex-col h-full">
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Звонки</h2>
        <Input 
          placeholder="Поиск звонков..." 
          className="bg-muted border-border"
        />
      </div>
      <ScrollArea className="flex-1">
        {mockCalls.map((call) => (
          <div key={call.id} className="flex items-center gap-3 p-4 hover:bg-muted transition-colors">
            <Avatar>
              <AvatarFallback className="bg-primary text-primary-foreground">{call.avatar}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">{call.name}</span>
                <Icon 
                  name={call.type === 'incoming' ? 'PhoneIncoming' : call.type === 'outgoing' ? 'PhoneOutgoing' : 'PhoneMissed'} 
                  size={14}
                  className={call.type === 'missed' ? 'text-destructive' : 'text-primary'}
                />
              </div>
              <div className="text-sm text-muted-foreground">
                {call.time} {call.duration && `• ${call.duration}`}
              </div>
            </div>
            <Button size="icon" variant="ghost">
              <Icon name="Phone" size={20} />
            </Button>
            <Button size="icon" variant="ghost">
              <Icon name="Video" size={20} />
            </Button>
          </div>
        ))}
      </ScrollArea>
    </div>
  );

  const renderContacts = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Контакты</h2>
          <Button size="icon" variant="ghost">
            <Icon name="UserPlus" size={20} />
          </Button>
        </div>
        <Input 
          placeholder="Поиск контактов..." 
          className="bg-muted border-border"
        />
      </div>
      <ScrollArea className="flex-1">
        {mockChats.map((contact) => (
          <div key={contact.id} className="flex items-center gap-3 p-4 hover:bg-muted transition-colors">
            <Avatar>
              <AvatarFallback className="bg-primary text-primary-foreground">{contact.avatar}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="font-medium">{contact.name}</div>
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <Icon name="Shield" size={12} className="text-primary" />
                E2E Encryption
              </div>
            </div>
            <Button size="icon" variant="ghost">
              <Icon name="MessageCircle" size={20} />
            </Button>
          </div>
        ))}
      </ScrollArea>
    </div>
  );

  const renderProfile = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 space-y-6">
        <h2 className="text-2xl font-bold">Профиль</h2>
        
        <div className="flex flex-col items-center gap-4">
          <Avatar className="w-24 h-24">
            <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
              {anonymousId.substring(1, 3).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            <h3 className="text-xl font-bold">Анонимный {anonymousId}</h3>
            <p className="text-sm text-muted-foreground mt-1">Ваш уникальный ID</p>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <Icon name="Shield" size={20} className="text-primary" />
              <div>
                <div className="font-medium">Защищенный профиль</div>
                <div className="text-sm text-muted-foreground">E2E шифрование активно</div>
              </div>
            </div>
            <Badge className="bg-primary text-primary-foreground">Активно</Badge>
          </div>

          <div className="p-4 bg-card rounded-lg border border-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Статус онлайн</span>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Показывать аватар</span>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Подтверждение прочтения</span>
              <Switch defaultChecked />
            </div>
          </div>
        </div>

        <Button className="w-full" variant="outline" onClick={handleLogout}>
          <Icon name="LogOut" size={16} className="mr-2" />
          Выйти из аккаунта
        </Button>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 space-y-6">
        <h2 className="text-2xl font-bold">Настройки безопасности</h2>

        <div className="space-y-4">
          <div className="p-4 bg-card rounded-lg border border-border">
            <div className="flex items-center gap-3 mb-4">
              <Icon name="Lock" size={24} className="text-primary" />
              <div>
                <h3 className="font-medium">End-to-End шифрование</h3>
                <p className="text-sm text-muted-foreground">Все сообщения защищены</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Шифрование сообщений</span>
                <Switch defaultChecked disabled />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Шифрование звонков</span>
                <Switch defaultChecked disabled />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Шифрование файлов</span>
                <Switch defaultChecked disabled />
              </div>
            </div>
          </div>

          <div className="p-4 bg-card rounded-lg border border-border">
            <div className="flex items-center gap-3 mb-4">
              <Icon name="Eye" size={24} className="text-secondary" />
              <div>
                <h3 className="font-medium">Приватность</h3>
                <p className="text-sm text-muted-foreground">Управление видимостью</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Последняя активность</span>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Статус онлайн</span>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Профиль для незнакомых</span>
                <Switch />
              </div>
            </div>
          </div>

          <div className="p-4 bg-card rounded-lg border border-border">
            <div className="flex items-center gap-3 mb-4">
              <Icon name="Key" size={24} className="text-secondary" />
              <div>
                <h3 className="font-medium">Ключи безопасности</h3>
                <p className="text-sm text-muted-foreground">Проверка подлинности</p>
              </div>
            </div>
            <Button variant="outline" className="w-full">
              <Icon name="QrCode" size={16} className="mr-2" />
              Показать QR код безопасности
            </Button>
          </div>

          <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
            <div className="flex items-center gap-3 mb-2">
              <Icon name="AlertTriangle" size={20} className="text-destructive" />
              <h3 className="font-medium text-destructive">Удаление данных</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Безвозвратное удаление всех сообщений и данных
            </p>
            <Button variant="destructive" className="w-full">
              Удалить все данные
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background text-foreground">
      <div className="w-20 bg-card border-r border-border flex flex-col items-center py-6 gap-4">
        <div className="p-3 bg-primary rounded-full mb-4">
          <Icon name="MessageCircle" size={24} className="text-primary-foreground" />
        </div>
        
        <Button
          variant={activeTab === 'chats' ? 'default' : 'ghost'}
          size="icon"
          onClick={() => setActiveTab('chats')}
          className="relative"
        >
          <Icon name="MessageSquare" size={20} />
          {activeTab === 'chats' && <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-l" />}
        </Button>

        <Button
          variant={activeTab === 'calls' ? 'default' : 'ghost'}
          size="icon"
          onClick={() => setActiveTab('calls')}
          className="relative"
        >
          <Icon name="Phone" size={20} />
          {activeTab === 'calls' && <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-l" />}
        </Button>

        <Button
          variant={activeTab === 'contacts' ? 'default' : 'ghost'}
          size="icon"
          onClick={() => setActiveTab('contacts')}
          className="relative"
        >
          <Icon name="Users" size={20} />
          {activeTab === 'contacts' && <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-l" />}
        </Button>

        <div className="flex-1" />

        <Button
          variant={activeTab === 'profile' ? 'default' : 'ghost'}
          size="icon"
          onClick={() => setActiveTab('profile')}
          className="relative"
        >
          <Icon name="User" size={20} />
          {activeTab === 'profile' && <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-l" />}
        </Button>

        <Button
          variant={activeTab === 'settings' ? 'default' : 'ghost'}
          size="icon"
          onClick={() => setActiveTab('settings')}
          className="relative"
        >
          <Icon name="Settings" size={20} />
          {activeTab === 'settings' && <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-l" />}
        </Button>
      </div>

      <div className="w-80 bg-card border-r border-border">
        {activeTab === 'chats' && renderChatList()}
        {activeTab === 'calls' && renderCalls()}
        {activeTab === 'contacts' && renderContacts()}
        {activeTab === 'profile' && renderProfile()}
        {activeTab === 'settings' && renderSettings()}
      </div>

      <div className="flex-1">
        {activeTab === 'chats' && selectedChat ? (
          renderChatWindow()
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Icon name="MessageCircle" size={40} className="text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2">Выберите чат</h3>
                <p className="text-muted-foreground">
                  Все сообщения защищены end-to-end шифрованием
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}