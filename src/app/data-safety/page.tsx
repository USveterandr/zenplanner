'use client';

import { Shield, Lock, User, Trash2, Eye, Server, Mail, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DataSafetyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 pt-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl mb-4 shadow-lg">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Data Safety</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Your privacy is important to us. This page explains how Zen Planner collects, uses, and protects your data.
          </p>
        </div>

        {/* Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-violet-500" />
              Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Zen Planner is committed to protecting your privacy. We collect only the minimum data necessary to provide our services, and all data is encrypted in transit. We do not sell your personal data to third parties.
            </p>
          </CardContent>
        </Card>

        {/* Data Collection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-violet-500" />
              Data Collection and Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-medium">Data Encrypted in Transit</h3>
                <p className="text-sm text-muted-foreground">
                  All data transmitted between your device and our servers is encrypted using industry-standard TLS/HTTPS encryption.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-medium">Secure Authentication</h3>
                <p className="text-sm text-muted-foreground">
                  User accounts are protected with secure password-based authentication.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-medium">No Data Selling</h3>
                <p className="text-sm text-muted-foreground">
                  We do not sell, trade, or rent your personal information to third parties.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Types */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-violet-500" />
              Data Types We Collect
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-medium flex items-center gap-2 mb-2">
                  <User className="h-4 w-4" />
                  Account Data
                </h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Email address (for account creation)</li>
                  <li>• Name (optional, for personalization)</li>
                  <li>• Password (encrypted)</li>
                </ul>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-medium flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4" />
                  App Activity
                </h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Tasks, goals, and habits you create</li>
                  <li>• AI Advisor conversations</li>
                  <li>• Usage analytics</li>
                </ul>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-medium flex items-center gap-2 mb-2">
                  <Eye className="h-4 w-4" />
                  Device Data
                </h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Device type and OS version</li>
                  <li>• Browser information</li>
                  <li>• Crash logs (for debugging)</li>
                </ul>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-medium flex items-center gap-2 mb-2">
                  <Mail className="h-4 w-4" />
                  Communications
                </h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• AI Advisor messages</li>
                  <li>• Support inquiries</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Usage */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Data Usage and Handling</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">How We Use Your Data</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>1. <strong>Provide Services:</strong> To deliver task management, goal tracking, habit building, and AI features</li>
                <li>2. <strong>Personalization:</strong> To customize your experience and provide relevant suggestions</li>
                <li>3. <strong>Communication:</strong> To send important updates about your account</li>
                <li>4. <strong>Improvement:</strong> To analyze usage patterns and improve our services</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">Data Retention</h3>
              <p className="text-sm text-muted-foreground">
                We retain your account data for as long as your account is active. You can request deletion of your data at any time. Inactive accounts may have data deleted after 2 years of inactivity.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Delete Account */}
        <Card className="mb-6 border-violet-200 dark:border-violet-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-violet-600">
              <Trash2 className="h-5 w-5" />
              Request Data Deletion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              You can request deletion of your account and all associated data at any time. This includes:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 mb-4">
              <li>• All tasks, goals, and habits</li>
              <li>• AI Advisor conversation history</li>
              <li>• Account information (email, name)</li>
              <li>• All other user data</li>
            </ul>
            <Link href="/delete-account">
              <Button className="bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700">
                <Trash2 className="h-4 w-4 mr-2" />
                Request Account Deletion
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Us</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              If you have any questions about this Data Safety policy or our privacy practices, please contact us.
            </p>
            <p className="text-sm">
              <strong>Email:</strong> isaactrinidadllc@gmail.com
            </p>
          </CardContent>
        </Card>

        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>Last updated: March 2026</p>
        </div>
      </div>
    </div>
  );
}
