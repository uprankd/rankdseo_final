'use client';

import { useState } from 'react';
import { trpc } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { HelpCircle, Plus, MessageSquare, Clock, CheckCircle, Send, ChevronDown, ChevronUp, X } from 'lucide-react';

const STATUS_MAP = {
  OPEN: { label: 'Open', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  ANSWERED: { label: 'Answered', color: 'bg-green-100 text-green-800 border-green-300' },
  CLOSED: { label: 'Closed', color: 'bg-gray-100 text-gray-600 border-gray-300' },
};

const CATEGORY_OPTIONS = [
  { value: 'general', label: 'General Question' },
  { value: 'billing', label: 'Billing & Payments' },
  { value: 'technical', label: 'Technical Issue' },
  { value: 'account', label: 'Account Help' },
  { value: 'feature', label: 'Feature Request' },
];

export default function HelpPage() {
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});

  // Form state
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('general');

  const { data: tickets, refetch } = trpc.support.listMyTickets.useQuery();

  const createTicket = trpc.support.createTicket.useMutation({
    onSuccess: () => {
      toast.success('Support ticket created! We\'ll get back to you soon.');
      setShowNewTicket(false);
      setSubject('');
      setMessage('');
      setCategory('general');
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const replyToTicket = trpc.support.replyToTicket.useMutation({
    onSuccess: (_, vars) => {
      toast.success('Reply sent');
      setReplyText(prev => ({ ...prev, [vars.ticketId]: '' }));
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const closeTicket = trpc.support.closeTicket.useMutation({
    onSuccess: () => { toast.success('Ticket closed'); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const openCount = tickets?.filter(t => t.status === 'OPEN').length || 0;
  const answeredCount = tickets?.filter(t => t.status === 'ANSWERED').length || 0;

  return (
    <div className="space-y-6" data-testid="help-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <HelpCircle className="h-7 w-7 text-blue-600" />
            Help & Support
          </h1>
          <p className="text-gray-500 mt-1">Submit a ticket and our team will assist you</p>
        </div>
        <Button
          onClick={() => setShowNewTicket(!showNewTicket)}
          className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
          data-testid="new-ticket-btn"
        >
          {showNewTicket ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
          {showNewTicket ? 'Cancel' : 'New Ticket'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-2 border-amber-200 bg-amber-50/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-700">{openCount}</p>
            <p className="text-sm text-amber-600">Open</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-green-200 bg-green-50/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{answeredCount}</p>
            <p className="text-sm text-green-600">Answered</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-gray-200 bg-gray-50/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-700">{tickets?.length || 0}</p>
            <p className="text-sm text-gray-600">Total</p>
          </CardContent>
        </Card>
      </div>

      {/* New Ticket Form */}
      {showNewTicket && (
        <Card className="border-2 border-blue-200 shadow-lg" data-testid="new-ticket-form">
          <CardHeader>
            <CardTitle className="text-lg">Create a Support Ticket</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Brief description of your issue"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  data-testid="ticket-subject-input"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full h-10 px-3 border-2 rounded-md text-sm bg-white"
                  data-testid="ticket-category-select"
                >
                  {CATEGORY_OPTIONS.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Describe your issue in detail..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={4}
                data-testid="ticket-message-input"
              />
            </div>
            <Button
              onClick={() => createTicket.mutate({ subject, message, category: category as any })}
              disabled={createTicket.isPending || !subject.trim() || !message.trim()}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
              data-testid="submit-ticket-btn"
            >
              <Send className="h-4 w-4 mr-2" />
              {createTicket.isPending ? 'Submitting...' : 'Submit Ticket'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tickets List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Your Tickets</h2>
        {!tickets || tickets.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">No tickets yet</p>
              <p className="text-gray-400 text-sm">Create a new ticket to get help from our team</p>
            </CardContent>
          </Card>
        ) : (
          tickets.map(ticket => {
            const isExpanded = expandedTicket === ticket.id;
            const status = STATUS_MAP[ticket.status as keyof typeof STATUS_MAP];
            return (
              <Card key={ticket.id} className="border-2 hover:border-blue-200 transition-all" data-testid={`ticket-${ticket.id}`}>
                <CardContent className="p-0">
                  {/* Ticket Header */}
                  <button
                    className="w-full p-4 flex items-center justify-between text-left"
                    onClick={() => setExpandedTicket(isExpanded ? null : ticket.id)}
                    data-testid={`ticket-toggle-${ticket.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={`text-xs border ${status.color}`}>{status.label}</Badge>
                        <Badge variant="outline" className="text-xs capitalize">{ticket.category}</Badge>
                        {ticket.replies.length > 0 && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" /> {ticket.replies.length}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 truncate">{ticket.subject}</h3>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" /> {new Date(ticket.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {isExpanded ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t px-4 pb-4" data-testid={`ticket-detail-${ticket.id}`}>
                      {/* Original message */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3">
                        <p className="text-xs text-blue-600 font-semibold mb-1">You</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{ticket.message}</p>
                      </div>

                      {/* Replies */}
                      {ticket.replies.map(reply => (
                        <div key={reply.id} className={`mt-3 rounded-lg p-4 border ${reply.isAdmin ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
                          <p className={`text-xs font-semibold mb-1 ${reply.isAdmin ? 'text-green-700' : 'text-blue-600'}`}>
                            {reply.isAdmin ? 'Support Team' : 'You'} · {new Date(reply.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{reply.message}</p>
                        </div>
                      ))}

                      {/* Reply input + close button */}
                      {ticket.status !== 'CLOSED' && (
                        <div className="mt-4 flex gap-2">
                          <Input
                            placeholder="Write a reply..."
                            value={replyText[ticket.id] || ''}
                            onChange={e => setReplyText(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                            className="flex-1"
                            data-testid={`ticket-reply-input-${ticket.id}`}
                          />
                          <Button
                            size="sm"
                            onClick={() => replyToTicket.mutate({ ticketId: ticket.id, message: replyText[ticket.id] || '' })}
                            disabled={!replyText[ticket.id]?.trim() || replyToTicket.isPending}
                            className="bg-blue-600 text-white"
                            data-testid={`ticket-reply-btn-${ticket.id}`}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => closeTicket.mutate({ ticketId: ticket.id })}
                            className="border-gray-300 text-gray-500"
                            data-testid={`ticket-close-btn-${ticket.id}`}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" /> Close
                          </Button>
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
