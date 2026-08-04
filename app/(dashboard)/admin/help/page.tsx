'use client';

import { useState } from 'react';
import { trpc } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Headphones, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  Send, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle, 
  Inbox, 
  Filter,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Archive,
  Info,
  Crown,
  User,
  AlertTriangle
} from 'lucide-react';

const STATUS_MAP = {
  OPEN: { label: 'Open', color: 'bg-amber-100 text-amber-800 border-amber-300', icon: AlertCircle },
  ANSWERED: { label: 'Answered', color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle },
  CLOSED: { label: 'Closed', color: 'bg-gray-100 text-gray-600 border-gray-300', icon: CheckCircle },
};

const PRIORITY_MAP = {
  LOW: { color: 'bg-blue-100 text-blue-700 border-blue-300' },
  MEDIUM: { color: 'bg-amber-100 text-amber-700 border-amber-300' },
  HIGH: { color: 'bg-red-100 text-red-700 border-red-300' },
};

// Helper to get user type badge
function getUserTypeBadge(user: any) {
  if (!user.subscription || user.subscription.status !== 'ACTIVE') {
    return <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-300 text-xs">
      <User className="h-3 w-3 mr-1" />
      Free User
    </Badge>;
  }

  const planPrice = user.subscription.plan?.price || 0;
  
  if (planPrice === 0) {
    return <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 text-xs">
      <Clock className="h-3 w-3 mr-1" />
      Trial User
    </Badge>;
  }

  return <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 text-xs">
    <Crown className="h-3 w-3 mr-1" />
    Paid Customer
  </Badge>;
}

// Helper to get spam risk badge
function getSpamRiskBadge(spamScore: number) {
  if (spamScore >= 75) {
    return <Badge className="bg-red-100 text-red-800 border-red-300 text-xs">
      <ShieldAlert className="h-3 w-3 mr-1" />
      High Risk ({spamScore})
    </Badge>;
  } else if (spamScore >= 50) {
    return <Badge className="bg-orange-100 text-orange-800 border-orange-300 text-xs">
      <AlertTriangle className="h-3 w-3 mr-1" />
      Suspicious ({spamScore})
    </Badge>;
  } else if (spamScore >= 25) {
    return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 text-xs">
      <Shield className="h-3 w-3 mr-1" />
      Low Risk ({spamScore})
    </Badge>;
  }
  return <Badge className="bg-green-100 text-green-800 border-green-300 text-xs">
    <ShieldCheck className="h-3 w-3 mr-1" />
    Verified ({spamScore})
  </Badge>;
}

export default function AdminHelpPage() {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'ANSWERED' | 'CLOSED'>('ALL');
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'inbox' | 'spam'>('inbox');

  const { data: stats } = trpc.support.getStats.useQuery();
  const { data: tickets, refetch } = trpc.support.listAllTickets.useQuery({ status: statusFilter, includeSpam: false });
  const { data: spamTickets, refetch: refetchSpam } = trpc.support.listSpamTickets.useQuery();

  const replyToTicket = trpc.support.replyToTicket.useMutation({
    onSuccess: (_data, vars) => {
      toast.success('Reply sent to user');
      if (vars && 'ticketId' in vars) {
        setReplyText(prev => ({ ...prev, [vars.ticketId]: '' }));
      }
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const closeTicket = trpc.support.closeTicket.useMutation({
    onSuccess: () => { toast.success('Ticket closed'); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const markAsSpam = trpc.support.markAsSpam.useMutation({
    onSuccess: () => {
      toast.success('Moved to spam');
      refetch();
      refetchSpam();
    },
    onError: (e) => toast.error(e.message),
  });

  const markAsNotSpam = trpc.support.markAsNotSpam.useMutation({
    onSuccess: () => {
      toast.success('Recovered from spam');
      refetch();
      refetchSpam();
    },
    onError: (e) => toast.error(e.message),
  });

  const displayedTickets = activeTab === 'inbox' ? tickets : spamTickets;

  return (
    <div className="space-y-6" data-testid="admin-help-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Headphones className="h-7 w-7 text-purple-600" />
          Help Desk
        </h1>
        <p className="text-gray-500 mt-1">Manage and respond to user support tickets</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="border-2 border-amber-200 bg-amber-50/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-700">{stats?.open || 0}</p>
            <p className="text-sm text-amber-600 font-medium">Open</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-green-200 bg-green-50/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{stats?.answered || 0}</p>
            <p className="text-sm text-green-600 font-medium">Answered</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-gray-200 bg-gray-50/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-700">{stats?.closed || 0}</p>
            <p className="text-sm text-gray-600 font-medium">Closed</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-blue-200 bg-blue-50/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{stats?.total || 0}</p>
            <p className="text-sm text-blue-600 font-medium">Total</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-red-200 bg-red-50/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-700">{stats?.spam || 0}</p>
            <p className="text-sm text-red-600 font-medium">Spam</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Inbox / Spam */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'inbox' | 'spam')}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="inbox" className="flex items-center gap-2">
            <Inbox className="h-4 w-4" />
            Inbox ({stats?.total || 0})
          </TabsTrigger>
          <TabsTrigger value="spam" className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            Spam ({stats?.spam || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="space-y-4 mt-6">
          {/* Filter Buttons */}
          <div className="flex gap-2">
            {['ALL', 'OPEN', 'ANSWERED', 'CLOSED'].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status as any)}
                className="capitalize"
              >
                {status.toLowerCase()}
              </Button>
            ))}
          </div>

          {/* Inbox Tickets */}
          {!tickets || tickets.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-gray-500">
                <Inbox className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No tickets in inbox</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <Card key={ticket.id} className="border-2 hover:shadow-lg transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Header Row */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="font-semibold text-lg">{ticket.subject}</h3>
                          <Badge variant="outline" className={STATUS_MAP[ticket.status].color}>
                            {STATUS_MAP[ticket.status].label}
                          </Badge>
                          <Badge variant="outline" className={PRIORITY_MAP[ticket.priority].color}>
                            {ticket.priority}
                          </Badge>
                          {getUserTypeBadge(ticket.user)}
                          {ticket.spamScore > 0 && getSpamRiskBadge(ticket.spamScore)}
                        </div>

                        {/* User Info */}
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            {ticket.user.name || 'Unknown'}
                          </span>
                          <span>{ticket.user.email}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {new Date(ticket.createdAt).toLocaleDateString()}
                          </span>
                          {ticket.user.subscription?.plan && (
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {ticket.user.subscription.plan.name}
                            </span>
                          )}
                        </div>

                        {/* Spam Reason Tooltip */}
                        {ticket.spamReason && (
                          <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                            <div className="flex items-start gap-2">
                              <Info className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="font-semibold text-yellow-800">Spam Detection Reasons:</p>
                                <p className="text-yellow-700">{ticket.spamReason}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Message Preview */}
                        {expandedTicket !== ticket.id && (
                          <p className="text-gray-700 text-sm line-clamp-2">{ticket.message}</p>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedTicket(expandedTicket === ticket.id ? null : ticket.id)}
                      >
                        {expandedTicket === ticket.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </Button>
                    </div>

                    {/* Expanded Content */}
                    {expandedTicket === ticket.id && (
                      <div className="mt-4 space-y-4 border-t pt-4">
                        {/* Full Message */}
                        <div className="bg-gray-50 p-4 rounded">
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">{ticket.message}</p>
                        </div>

                        {/* Replies */}
                        {ticket.replies.length > 0 && (
                          <div className="space-y-3">
                            {ticket.replies.map((reply) => (
                              <div
                                key={reply.id}
                                className={`p-3 rounded ${reply.isAdmin ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-gray-50'}`}
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-semibold text-sm">
                                    {reply.user.name || 'Unknown'}
                                    {reply.isAdmin && <Badge className="ml-2 bg-blue-500 text-white text-xs">Admin</Badge>}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(reply.createdAt).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{reply.message}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Reply Form */}
                        {ticket.status !== 'CLOSED' && (
                          <div className="space-y-3">
                            <Textarea
                              placeholder="Type your reply..."
                              value={replyText[ticket.id] || ''}
                              onChange={(e) => setReplyText(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                              rows={3}
                              className="border-2"
                            />
                            <div className="flex gap-2">
                              <Button
                                onClick={() => replyToTicket.mutate({ ticketId: ticket.id, message: replyText[ticket.id] })}
                                disabled={!replyText[ticket.id]?.trim() || replyToTicket.isPending}
                                className="bg-blue-500 hover:bg-blue-600"
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Send Reply
                              </Button>
                              <Button
                                onClick={() => closeTicket.mutate({ ticketId: ticket.id })}
                                disabled={closeTicket.isPending}
                                variant="outline"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Close Ticket
                              </Button>
                              <Button
                                onClick={() => markAsSpam.mutate({ ticketId: ticket.id, reason: 'Manually marked by admin' })}
                                disabled={markAsSpam.isPending}
                                variant="destructive"
                                className="ml-auto"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Mark as Spam
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="spam" className="space-y-4 mt-6">
          {/* Spam Tickets */}
          {!spamTickets || spamTickets.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-gray-500">
                <ShieldCheck className="h-12 w-12 mx-auto mb-4 text-green-400" />
                <p className="font-semibold text-lg">No Spam Detected</p>
                <p className="text-sm">Your inbox is clean!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {spamTickets.map((ticket) => (
                <Card key={ticket.id} className="border-2 border-red-200 bg-red-50/30">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Header Row */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="font-semibold text-lg">{ticket.subject}</h3>
                          <Badge className="bg-red-500 text-white">SPAM</Badge>
                          {getSpamRiskBadge(ticket.spamScore)}
                          {getUserTypeBadge(ticket.user)}
                        </div>

                        {/* User Info */}
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <span>{ticket.user.name || 'Unknown'}</span>
                          <span>{ticket.user.email}</span>
                          <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                        </div>

                        {/* Spam Reason */}
                        {ticket.spamReason && (
                          <div className="mb-3 p-2 bg-red-100 border border-red-200 rounded text-xs">
                            <div className="flex items-start gap-2">
                              <ShieldAlert className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="font-semibold text-red-800">Why This is Spam:</p>
                                <p className="text-red-700">{ticket.spamReason}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Message Preview */}
                        <p className="text-gray-700 text-sm line-clamp-2">{ticket.message}</p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => markAsNotSpam.mutate({ ticketId: ticket.id })}
                          disabled={markAsNotSpam.isPending}
                          variant="outline"
                          size="sm"
                        >
                          <Archive className="h-4 w-4 mr-2" />
                          Not Spam
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
