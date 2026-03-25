'use client';

import { useState } from 'react';
import { trpc } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Headphones, MessageSquare, Clock, CheckCircle, Send, ChevronDown, ChevronUp, AlertCircle, Inbox, Filter } from 'lucide-react';

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

export default function AdminHelpPage() {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'ANSWERED' | 'CLOSED'>('ALL');
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});

  const { data: stats } = trpc.support.getStats.useQuery();
  const { data: tickets, refetch } = trpc.support.listAllTickets.useQuery({ status: statusFilter });

  const replyToTicket = trpc.support.replyToTicket.useMutation({
    onSuccess: (_, vars) => {
      toast.success('Reply sent to user');
      setReplyText(prev => ({ ...prev, [vars.ticketId]: '' }));
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const closeTicket = trpc.support.closeTicket.useMutation({
    onSuccess: () => { toast.success('Ticket closed'); refetch(); },
    onError: (e) => toast.error(e.message),
  });

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
      <div className="grid grid-cols-4 gap-4">
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
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-600">Filter:</span>
        {(['ALL', 'OPEN', 'ANSWERED', 'CLOSED'] as const).map(s => (
          <Button
            key={s}
            size="sm"
            variant={statusFilter === s ? 'default' : 'outline'}
            onClick={() => setStatusFilter(s)}
            className={statusFilter === s ? 'bg-navy-600 text-white' : ''}
            data-testid={`filter-${s.toLowerCase()}`}
          >
            {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
            {s === 'OPEN' && stats?.open ? ` (${stats.open})` : ''}
          </Button>
        ))}
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        {!tickets || tickets.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="p-8 text-center">
              <Inbox className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">No tickets found</p>
              <p className="text-gray-400 text-sm">
                {statusFilter !== 'ALL' ? 'Try changing the filter' : 'No support requests yet'}
              </p>
            </CardContent>
          </Card>
        ) : (
          tickets.map(ticket => {
            const isExpanded = expandedTicket === ticket.id;
            const status = STATUS_MAP[ticket.status as keyof typeof STATUS_MAP];
            const priority = PRIORITY_MAP[ticket.priority as keyof typeof PRIORITY_MAP];
            const StatusIcon = status.icon;
            return (
              <Card key={ticket.id} className={`border-2 transition-all ${ticket.status === 'OPEN' ? 'hover:border-amber-300 border-amber-100' : 'hover:border-blue-200'}`} data-testid={`admin-ticket-${ticket.id}`}>
                <CardContent className="p-0">
                  {/* Ticket Header */}
                  <button
                    className="w-full p-4 flex items-center justify-between text-left"
                    onClick={() => setExpandedTicket(isExpanded ? null : ticket.id)}
                    data-testid={`admin-ticket-toggle-${ticket.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge className={`text-xs border ${status.color}`}>
                          <StatusIcon className="h-3 w-3 mr-1" /> {status.label}
                        </Badge>
                        <Badge className={`text-xs border ${priority.color}`}>{ticket.priority}</Badge>
                        <Badge variant="outline" className="text-xs capitalize">{ticket.category}</Badge>
                        {ticket.replies.length > 0 && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" /> {ticket.replies.length} replies
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 truncate">{ticket.subject}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-blue-600 font-medium">{ticket.user.name || ticket.user.email}</span>
                        <span className="text-xs text-gray-400">·</span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {new Date(ticket.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t px-4 pb-4" data-testid={`admin-ticket-detail-${ticket.id}`}>
                      {/* Original message */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3">
                        <p className="text-xs text-blue-600 font-semibold mb-1">{ticket.user.name || ticket.user.email}</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{ticket.message}</p>
                      </div>

                      {/* Replies */}
                      {ticket.replies.map(reply => (
                        <div key={reply.id} className={`mt-3 rounded-lg p-4 border ${reply.isAdmin ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
                          <p className={`text-xs font-semibold mb-1 ${reply.isAdmin ? 'text-green-700' : 'text-blue-600'}`}>
                            {reply.isAdmin ? 'You (Admin)' : (reply.user.name || reply.user.email)} · {new Date(reply.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{reply.message}</p>
                        </div>
                      ))}

                      {/* Reply input */}
                      {ticket.status !== 'CLOSED' && (
                        <div className="mt-4 space-y-2">
                          <Textarea
                            placeholder="Write your response to the user..."
                            value={replyText[ticket.id] || ''}
                            onChange={e => setReplyText(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                            rows={3}
                            data-testid={`admin-reply-input-${ticket.id}`}
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={() => replyToTicket.mutate({ ticketId: ticket.id, message: replyText[ticket.id] || '' })}
                              disabled={!replyText[ticket.id]?.trim() || replyToTicket.isPending}
                              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white"
                              data-testid={`admin-reply-btn-${ticket.id}`}
                            >
                              <Send className="h-4 w-4 mr-2" />
                              {replyToTicket.isPending ? 'Sending...' : 'Send Reply'}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => closeTicket.mutate({ ticketId: ticket.id })}
                              className="border-gray-300 text-gray-500"
                              data-testid={`admin-close-btn-${ticket.id}`}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" /> Close Ticket
                            </Button>
                          </div>
                        </div>
                      )}

                      {ticket.status === 'CLOSED' && (
                        <div className="mt-4 text-center py-2 bg-gray-100 rounded-lg">
                          <p className="text-sm text-gray-500 font-medium flex items-center justify-center gap-1">
                            <CheckCircle className="h-4 w-4" /> This ticket is closed
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
