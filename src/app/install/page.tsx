'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Smartphone, 
  Download, 
  Check, 
  ChevronRight,
  Safari,
  Settings,
  Plus,
  ArrowDown
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function InstallPage() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
  }, []);

  if (isStandalone) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:to-slate-900 p-4 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-2">App Already Installed!</h1>
            <p className="text-muted-foreground mb-6">
              Zen Planner is already on your device. Tap the icon to open it.
            </p>
            <Link href="/">
              <Button className="bg-gradient-to-r from-violet-500 to-indigo-600">
                Open Zen Planner
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-3xl mb-4 shadow-lg">
            <Smartphone className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Install Zen Planner</h1>
          <p className="text-muted-foreground">
            Add Zen Planner to your home screen for a native app experience
          </p>
        </div>

        {/* iOS Instructions */}
        {isIOS ? (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Safari className="h-5 w-5 text-violet-500" />
                iPhone / iPad Installation
              </h2>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-violet-100 dark:bg-violet-900 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-violet-600 font-semibold">1</span>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Open in Safari</h3>
                    <p className="text-sm text-muted-foreground">
                      Make sure you&apos;re using Safari browser (not Chrome or other browsers)
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-violet-100 dark:bg-violet-900 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-violet-600 font-semibold">2</span>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Tap the Share Button</h3>
                    <p className="text-sm text-muted-foreground">
                      Tap the <strong>Share button</strong> (square with arrow up) at the bottom of the screen
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-violet-100 dark:bg-violet-900 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-violet-600 font-semibold">3</span>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Tap &quot;Add to Home Screen&quot;</h3>
                    <p className="text-sm text-muted-foreground">
                      Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong>
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-violet-100 dark:bg-violet-900 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-violet-600 font-semibold">4</span>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Tap &quot;Add&quot;</h3>
                    <p className="text-sm text-muted-foreground">
                      Tap &quot;Add&quot; in the top right corner to confirm
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">
                      Installation complete!
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-500">
                      Look for the Zen Planner icon on your home screen
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Installation Instructions</h2>
              <p className="text-muted-foreground mb-4">
                To install Zen Planner on your device, please follow these steps:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>Open this page in Safari (iOS) or Chrome (Android)</li>
                <li>Tap the browser&apos;s share/menu button</li>
                <li>Select &quot;Add to Home Screen&quot;</li>
                <li>Confirm the installation</li>
              </ol>
            </CardContent>
          </Card>
        )}

        {/* Alternative - Open App */}
        <div className="text-center">
          <Link href="/">
            <Button variant="outline" className="mb-4">
              Open Zen Planner in Browser
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
          <p className="text-sm text-muted-foreground">
            You can also use Zen Planner directly in your browser
          </p>
        </div>

        {/* Features Preview */}
        <Card className="mt-8">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">What you get with Zen Planner:</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Smart Task Management</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>AI Advisor</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Calendar View</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Goal Tracking</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Habit Builder</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Analytics Dashboard</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
