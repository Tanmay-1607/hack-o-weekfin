/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Calendar, MessageSquare, BarChart3, Share2, Upload, BookOpen, Clock, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ExtractionResult, Message } from "./types";
import { extractCalendarInfo, chatWithSchedule } from "./lib/gemini";
import ReactMarkdown from "react-markdown";

export default function App() {
  const [activeTab, setActiveTab] = useState("upload");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isChatting, setIsChatting] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const result = await extractCalendarInfo(base64, file.type);
        setExtractionResult(result);
        setActiveTab("schedule");
        
        // Add initial greeting
        setMessages([
          { role: 'assistant', content: `I've extracted your schedule! Here's a summary: ${result.summary}\n\nWhat would you like to know about your courses or events?` }
        ]);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Extraction failed:", error);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !extractionResult || isChatting) return;

    const userMsg: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsChatting(true);

    try {
      const response = await chatWithSchedule(newMessages, extractionResult);
      setMessages([...newMessages, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error("Chat failed:", error);
      setMessages([...newMessages, { role: 'assistant', content: "Sorry, I encountered an error processing your request." }]);
    } finally {
      setIsChatting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F4] text-[#1A1A1A] font-sans selection:bg-orange-200">
      {/* Sidebar Navigation */}
      <div className="fixed left-0 top-0 h-full w-20 md:w-64 bg-white border-r border-[#E5E5E5] flex flex-col z-50">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-200">
            <Calendar size={24} />
          </div>
          <span className="hidden md:block font-bold text-xl tracking-tight">EduSchedule</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {[
            { id: "upload", icon: Upload, label: "Upload" },
            { id: "schedule", icon: BookOpen, label: "Schedule", disabled: !extractionResult },
            { id: "chat", icon: MessageSquare, label: "Assistant", disabled: !extractionResult },
            { id: "analytics", icon: BarChart3, label: "Analytics" },
            { id: "deploy", icon: Share2, label: "Deploy" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => !item.disabled && setActiveTab(item.id)}
              disabled={item.disabled}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === item.id
                  ? "bg-orange-50 text-orange-600 font-medium"
                  : item.disabled
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <item.icon size={20} />
              <span className="hidden md:block">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[#E5E5E5]">
          <div className="flex items-center gap-3 p-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-400 to-red-500" />
            <div className="hidden md:block">
              <p className="text-xs font-semibold">Sankul Wart</p>
              <p className="text-[10px] text-gray-400">Pro Plan</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="pl-20 md:pl-64 min-h-screen">
        <div className="max-w-6xl mx-auto p-6 md:p-10">
          <AnimatePresence mode="wait">
            {activeTab === "upload" && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold tracking-tight text-gray-900">Welcome back!</h1>
                  <p className="text-gray-500 text-lg">Upload your calendar to get started with your AI assistant.</p>
                </div>

                <Card className="border-2 border-dashed border-gray-200 bg-white/50 hover:bg-white hover:border-orange-400 transition-all duration-300 group">
                  <CardContent className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform duration-300">
                      <Upload size={32} />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-xl font-semibold">Click to upload or drag and drop</p>
                      <p className="text-sm text-gray-400">Supports PNG, JPG, JPEG (Max 10MB)</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      disabled={isExtracting}
                    />
                    {isExtracting && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-center items-center justify-center z-10 rounded-xl">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
                          <p className="font-medium text-orange-600 animate-pulse">Extracting your schedule...</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { title: "Entity Extraction", desc: "Extracts dates, courses, and instructors automatically.", icon: BookOpen },
                    { title: "Smart Chat", desc: "Ask questions about your schedule in natural language.", icon: MessageSquare },
                    { title: "Multi-channel", desc: "Sync with Slack, WhatsApp, and Google Calendar.", icon: Share2 },
                  ].map((feature, i) => (
                    <Card key={i} className="border-none shadow-sm bg-white">
                      <CardHeader>
                        <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-gray-600 mb-2">
                          <feature.icon size={20} />
                        </div>
                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                        <CardDescription>{feature.desc}</CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === "schedule" && extractionResult && (
              <motion.div
                key="schedule"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-bold tracking-tight">Your Schedule</h2>
                  <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200 px-3 py-1">
                    {extractionResult.events.length} Events Found
                  </Badge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="text-orange-600" size={20} />
                          Upcoming Events
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[500px] pr-4">
                          <div className="space-y-4">
                            {extractionResult.events.map((event) => (
                              <div key={event.id} className="flex gap-4 group">
                                <div className="flex flex-col items-center pt-1">
                                  <div className="w-2 h-2 rounded-full bg-orange-600" />
                                  <div className="w-px flex-1 bg-gray-100 my-1" />
                                </div>
                                <div className="flex-1 pb-4">
                                  <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                                      {event.title}
                                    </h4>
                                    <span className="text-xs font-medium text-gray-400">{event.date}</span>
                                  </div>
                                  <p className="text-sm text-gray-500 mb-2">{event.description}</p>
                                  <div className="flex gap-2">
                                    <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                                      {event.type}
                                    </Badge>
                                    {event.time && (
                                      <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                                        {event.time}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-6">
                    <Card className="border-none shadow-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BookOpen className="text-orange-600" size={20} />
                          Courses
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {extractionResult.courses.map((course) => (
                          <div key={course.id} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">{course.code || 'COURSE'}</span>
                              <Badge variant="outline" className="text-[10px]">{course.location || 'TBD'}</Badge>
                            </div>
                            <h4 className="font-semibold text-sm mb-1">{course.name}</h4>
                            <p className="text-xs text-gray-400">{course.instructor || 'Staff'}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    <Card className="bg-orange-600 text-white border-none shadow-lg shadow-orange-200 overflow-hidden relative">
                      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                      <CardHeader>
                        <CardTitle className="text-lg">Need help?</CardTitle>
                        <CardDescription className="text-orange-100">
                          Ask your AI assistant about deadlines, locations, or study tips.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <button
                          onClick={() => setActiveTab("chat")}
                          className="w-full py-2 bg-white text-orange-600 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
                        >
                          Start Chatting
                        </button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "chat" && extractionResult && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="h-[calc(100vh-120px)] flex flex-col"
              >
                <Card className="flex-1 flex flex-col border-none shadow-sm overflow-hidden">
                  <CardHeader className="border-b bg-white">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                        <MessageSquare size={20} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Schedule Assistant</CardTitle>
                        <CardDescription>Ask me anything about your calendar</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
                    <ScrollArea className="flex-1 p-6">
                      <div className="space-y-6 max-w-3xl mx-auto">
                        {messages.map((msg, i) => (
                          <div
                            key={i}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[80%] p-4 rounded-2xl ${
                                msg.role === 'user'
                                  ? "bg-orange-600 text-white rounded-tr-none shadow-md"
                                  : "bg-gray-100 text-gray-800 rounded-tl-none"
                              }`}
                            >
                              <div className="prose prose-sm prose-invert max-w-none">
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                              </div>
                            </div>
                          </div>
                        ))}
                        {isChatting && (
                          <div className="flex justify-start">
                            <div className="bg-gray-100 p-4 rounded-2xl rounded-tl-none flex gap-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                    <div className="p-4 bg-white border-t">
                      <div className="max-w-3xl mx-auto flex gap-2">
                        <input
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                          placeholder="Ask about your exams, classes, or instructors..."
                          className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                        />
                        <button
                          onClick={handleSendMessage}
                          disabled={isChatting || !input.trim()}
                          className="bg-orange-600 text-white p-3 rounded-xl hover:bg-orange-700 disabled:opacity-50 transition-colors"
                        >
                          <MessageSquare size={20} />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === "analytics" && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tight">Usage Analytics</h2>
                  <p className="text-gray-500">Monitor extraction accuracy and user engagement.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[
                    { label: "Total Extractions", value: "128", change: "+12%", color: "text-blue-600" },
                    { label: "Accuracy Rate", value: "98.4%", change: "+0.5%", color: "text-green-600" },
                    { label: "Avg. Response Time", value: "1.2s", change: "-0.3s", color: "text-orange-600" },
                    { label: "Active Users", value: "42", change: "+5", color: "text-purple-600" },
                  ].map((stat, i) => (
                    <Card key={i} className="border-none shadow-sm">
                      <CardHeader className="pb-2">
                        <CardDescription>{stat.label}</CardDescription>
                        <CardTitle className={`text-3xl font-bold ${stat.color}`}>{stat.value}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">{stat.change}</span>
                        <span className="text-xs text-gray-400 ml-2">vs last month</span>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card className="border-none shadow-sm">
                  <CardHeader>
                    <CardTitle>Extraction Performance</CardTitle>
                    <CardDescription>Accuracy across different calendar formats</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px] flex items-end gap-4 pb-10">
                    {[60, 85, 45, 90, 75, 95, 80].map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ delay: i * 0.1, duration: 1 }}
                          className="w-full bg-orange-100 rounded-t-lg relative group"
                        >
                          <div className="absolute inset-0 bg-orange-600 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-lg" />
                        </motion.div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Day {i + 1}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === "deploy" && (
              <motion.div
                key="deploy"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tight">Multichannel Deployment</h2>
                  <p className="text-gray-500">Connect your schedule assistant to your favorite platforms.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Card className="border-none shadow-sm overflow-hidden">
                    <div className="bg-[#25D366] p-4 flex items-center gap-3 text-white">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <MessageSquare size={24} />
                      </div>
                      <span className="font-bold">WhatsApp Integration</span>
                    </div>
                    <CardContent className="p-6 space-y-4">
                      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                        <div className="flex justify-start">
                          <div className="bg-white p-3 rounded-lg shadow-sm text-sm max-w-[80%]">
                            Hey! When is my next CS101 lecture?
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <div className="bg-[#DCF8C6] p-3 rounded-lg shadow-sm text-sm max-w-[80%]">
                            Your next CS101 lecture is tomorrow at 10:00 AM in Room 302. Don't forget your lab report!
                          </div>
                        </div>
                      </div>
                      <button className="w-full py-3 bg-[#25D366] text-white rounded-xl font-bold hover:opacity-90 transition-opacity">
                        Connect WhatsApp
                      </button>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm overflow-hidden">
                    <div className="bg-[#4A154B] p-4 flex items-center gap-3 text-white">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <MessageSquare size={24} />
                      </div>
                      <span className="font-bold">Slack Bot</span>
                    </div>
                    <CardContent className="p-6 space-y-4">
                      <div className="bg-gray-50 rounded-xl p-4 space-y-3 font-mono text-xs">
                        <div className="flex gap-2">
                          <span className="font-bold text-blue-600">@user</span>
                          <span>/schedule next</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="font-bold text-purple-600">@EduBot</span>
                          <span className="text-gray-600 italic">APP</span>
                          <div className="bg-white border p-2 rounded border-l-4 border-l-orange-500">
                            <p className="font-bold">Next Event: Midterm Exam</p>
                            <p>Date: Friday, Oct 24</p>
                            <p>Time: 2:00 PM</p>
                          </div>
                        </div>
                      </div>
                      <button className="w-full py-3 bg-[#4A154B] text-white rounded-xl font-bold hover:opacity-90 transition-opacity">
                        Add to Slack
                      </button>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-1 space-y-4">
                    <h3 className="text-2xl font-bold">Fallbacks & Human Handover</h3>
                    <p className="text-gray-500">
                      If the AI is unsure about a specific date or course, it can automatically flag the event for manual review or hand over to a human assistant.
                    </p>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-orange-600">
                        <AlertCircle size={16} />
                        Auto-flagging enabled
                      </div>
                      <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                        <Share2 size={16} />
                        Handover active
                      </div>
                    </div>
                  </div>
                  <div className="w-full md:w-64">
                    <Card className="bg-gray-50 border-none">
                      <CardContent className="p-4 text-center space-y-2">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Confidence Score</p>
                        <p className="text-4xl font-black text-gray-900">94%</p>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="w-[94%] h-full bg-green-500" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
