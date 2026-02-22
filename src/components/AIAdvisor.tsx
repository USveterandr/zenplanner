'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import type { ChatMessage } from '@/lib/types';
import {
  Send,
  Bot,
  User,
  Sparkles,
  Trash2,
  Lightbulb,
  Target,
  Calendar,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const quickPrompts = [
  { icon: Lightbulb, text: 'What should I focus on today?', color: 'text-amber-500' },
  { icon: Target, text: 'Help me prioritize my tasks', color: 'text-blue-500' },
  { icon: TrendingUp, text: 'How can I improve my productivity?', color: 'text-green-500' },
  { icon: Calendar, text: 'Suggest a schedule for my tasks', color: 'text-purple-500' },
];

interface ChatBubbleProps {
  message: ChatMessage;
}

function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex gap-3', isUser && 'flex-row-reverse')}
    >
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white'
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2.5',
          isUser
            ? 'bg-primary text-primary-foreground rounded-tr-sm'
            : 'bg-muted rounded-tl-sm'
        )}
      >
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
        <span className="text-xs opacity-60 mt-1 block">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </motion.div>
  );
}

export default function AIAdvisor() {
  const { tasks, goals, habits, chatMessages, addChatMessage, clearChat } = useAppStore();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    // Add user message
    addChatMessage({ role: 'user', content: text });
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          context: {
            tasks: tasks.map(t => ({
              id: t.id,
              title: t.title,
              description: t.description,
              completed: t.completed,
              priority: t.priority,
              dueDate: t.dueDate,
              category: t.category,
            })),
            goals: goals.map(g => ({
              id: g.id,
              title: g.title,
              description: g.description,
              progress: g.progress,
              milestones: g.milestones,
            })),
            habits: habits.map(h => ({
              id: h.id,
              title: h.title,
              streak: h.streak,
              completions: h.completions.slice(-7),
            })),
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        addChatMessage({ role: 'assistant', content: data.response });
      } else {
        addChatMessage({
          role: 'assistant',
          content: 'I apologize, I encountered an error. Please try again.',
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      addChatMessage({
        role: 'assistant',
        content: 'I seem to be having trouble connecting. Please check your connection and try again.',
      });
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <div className="bg-linear-to-br from-violet-500 to-indigo-600 p-2 rounded-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            AI Advisor
          </CardTitle>
          {chatMessages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearChat}>
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Get personalized productivity advice and task suggestions
        </p>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col overflow-hidden p-4 pt-0">
        {/* Chat Messages */}
        <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {chatMessages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 rounded-full bg-linear-to-br from-violet-500 to-indigo-600 flex items-center justify-center mx-auto mb-4">
                    <Bot className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-semibold mb-2">Hi, I'm Zen!</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                    Your AI productivity advisor. Ask me anything about managing your tasks,
                    goals, and habits.
                  </p>
                  <div className="grid gap-2 max-w-sm mx-auto">
                    {quickPrompts.map((prompt, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        className="justify-start h-auto py-3 px-4"
                        onClick={() => sendMessage(prompt.text)}
                      >
                        <prompt.icon className={cn('h-4 w-4 mr-3', prompt.color)} />
                        <span className="text-sm">{prompt.text}</span>
                      </Button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                chatMessages.map((message) => (
                  <ChatBubble key={message.id} message={message} />
                ))
              )}
            </AnimatePresence>

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className="bg-linear-to-br from-violet-500 to-indigo-600 w-8 h-8 rounded-full flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        {/* Quick prompts for existing chat */}
        {chatMessages.length > 0 && (
          <div className="flex gap-2 py-3 overflow-x-auto">
            {quickPrompts.slice(0, 3).map((prompt, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="cursor-pointer hover:bg-secondary/80 whitespace-nowrap px-3 py-1.5"
                onClick={() => sendMessage(prompt.text)}
              >
                <prompt.icon className={cn('h-3 w-3 mr-1.5', prompt.color)} />
                {prompt.text}
              </Badge>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2 pt-2 border-t">
          <Input
            ref={inputRef}
            placeholder="Ask me anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={() => sendMessage()} disabled={isLoading || !input.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </div>
  );
}
