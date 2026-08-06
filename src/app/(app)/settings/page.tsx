"use client";

import { useState, useEffect } from "react";
import { useCurrency } from "@/context/CurrencyContext";
import { useFinance } from "@/context/FinanceContext";
import { CURRENCIES } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/Card";
import { Settings as SettingsIcon, CreditCard, Globe, User, Bell, Shield, Database, Trash2, Download, Check, Save } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function SettingsPage() {
  const { currency, setCurrency } = useCurrency();
  const { clearAllData } = useFinance();
  const [activeTab, setActiveTab] = useState("profile");
  const [walletCards, setWalletCards] = useState<any[]>([]);
  const [isClearing, setIsClearing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then((res: any) => {
      const user = res?.data?.user;
      if (user) {
        setEmail(user.email || "");
        setFirstName(user.user_metadata?.first_name || "");
        setLastName(user.user_metadata?.last_name || "");
      }
    }).catch(() => {});

    const savedCards = localStorage.getItem("finora_wallet_items");
    if (savedCards) {
      try {
        setWalletCards(JSON.parse(savedCards));
      } catch (e) {}
    }
  }, []);

  const deleteCard = (id: string) => {
    if (confirm("Are you sure you want to delete this card?")) {
      const updated = walletCards.filter(c => c.id !== id);
      setWalletCards(updated);
      localStorage.setItem("finora_wallet_items", JSON.stringify(updated));
    }
  };

  const handleClearData = async () => {
    if (confirm("Are you SURE you want to permanently delete all your transactions, goals, credit cards, and investments? This cannot be undone.")) {
      setIsClearing(true);
      await clearAllData();
      setIsClearing(false);
      alert("All account data has been completely erased.");
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: firstName,
          last_name: lastName,
        }
      });
      if (error) {
        alert("Error saving profile: " + error.message);
      } else {
        alert("Profile updated successfully.");
      }
    } catch (err: any) {
      alert("Error saving: " + (err?.message || String(err)));
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "preferences", label: "Preferences", icon: Globe },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "data", label: "Data Management", icon: Database },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 border-b border-border pb-6">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-red-400">
          <SettingsIcon className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Settings</h2>
          <p className="text-muted-foreground text-sm mt-1">Manage your app preferences and account settings</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 shrink-0">
          <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto pb-4 md:pb-0 scrollbar-hide">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
          {activeTab === "profile" && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Personal Information</CardTitle>
                  <CardDescription>Update your personal details and how we can reach you.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">First Name</label>
                      <input 
                        type="text" 
                        placeholder="John" 
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Last Name</label>
                      <input 
                        type="text" 
                        placeholder="Doe" 
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Email Address</label>
                    <input 
                      type="email" 
                      placeholder="john.doe@example.com" 
                      value={email}
                      disabled 
                      className="flex h-10 w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm text-muted-foreground ring-offset-background cursor-not-allowed" 
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">Email cannot be changed directly. Contact support for assistance.</p>
                  </div>
                </CardContent>
                <CardFooter className="border-t border-border bg-muted/20 px-6 py-4">
                  <button onClick={handleSave} disabled={isSaving} className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </CardFooter>
              </Card>
            </div>
          )}

          {activeTab === "preferences" && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Globe className="h-5 w-5 text-primary" />
                    Currency Settings
                  </CardTitle>
                  <CardDescription>
                    Select your primary currency. All your financial data will be displayed in this currency.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {CURRENCIES.map(c => (
                      <button
                        key={c.code}
                        onClick={() => setCurrency(c.code)}
                        className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                          c.code === currency 
                            ? "border-primary bg-primary/10 text-red-400 shadow-sm" 
                            : "border-border bg-card hover:bg-secondary text-foreground"
                        }`}
                      >
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                          c.code === currency ? "bg-primary text-primary-foreground font-bold" : "bg-secondary text-muted-foreground font-medium"
                        }`}>
                          {c.symbol}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{c.code}</p>
                          <p className={`text-xs ${c.code === currency ? "text-primary/80" : "text-muted-foreground"}`}>
                            {c.name}
                          </p>
                        </div>
                        {c.code === currency && (
                          <div className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Date & Time Format</CardTitle>
                  <CardDescription>Customize how dates and times are displayed.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 max-w-sm">
                    <label className="text-sm font-medium text-foreground">Date Format</label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                      <option>DD/MM/YYYY</option>
                      <option>MM/DD/YYYY</option>
                      <option>YYYY-MM-DD</option>
                    </select>
                  </div>
                  <div className="space-y-2 max-w-sm">
                    <label className="text-sm font-medium text-foreground">Timezone</label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                      <option>Asia/Kolkata (IST)</option>
                      <option>UTC</option>
                      <option>America/New_York (EST)</option>
                    </select>
                  </div>
                </CardContent>
                <CardFooter className="border-t border-border bg-muted/20 px-6 py-4">
                  <button onClick={handleSave} disabled={isSaving} className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
                    {isSaving ? "Saving..." : "Save Preferences"}
                  </button>
                </CardFooter>
              </Card>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Communication Preferences</CardTitle>
                  <CardDescription>Choose how you want us to communicate with you.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Toggle Component Replacement using native checkbox */}
                  {[
                    { id: 'notif-1', title: 'Monthly Reports', desc: 'Receive a detailed monthly summary of your wealth.' },
                    { id: 'notif-2', title: 'Large Transactions', desc: 'Get alerted for any transaction over ₹50,000.' },
                    { id: 'notif-3', title: 'Security Alerts', desc: 'Receive emails about new logins and password changes.', checked: true },
                    { id: 'notif-4', title: 'Marketing & Promos', desc: 'Occasional emails about new features.', checked: false }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between gap-4 border-b border-border pb-4 last:border-0 last:pb-0">
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked={item.checked !== false} />
                        <div className="w-11 h-6 bg-secondary peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Password & Authentication</CardTitle>
                  <CardDescription>Manage your security credentials.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 max-w-sm">
                    <label className="text-sm font-medium text-foreground">Current Password</label>
                    <input type="password" placeholder="••••••••" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
                  </div>
                  <div className="space-y-2 max-w-sm">
                    <label className="text-sm font-medium text-foreground">New Password</label>
                    <input type="password" placeholder="••••••••" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
                  </div>
                </CardContent>
                <CardFooter className="border-t border-border bg-muted/20 px-6 py-4">
                  <button className="bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors">
                    Update Password
                  </button>
                </CardFooter>
              </Card>
            </div>
          )}

          {activeTab === "data" && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Export Data</CardTitle>
                  <CardDescription>Download a copy of your financial data for your records.</CardDescription>
                </CardHeader>
                <CardContent>
                  <button className="flex items-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors">
                    <Download className="h-4 w-4" />
                    Export as CSV
                  </button>
                </CardContent>
              </Card>

              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Manage Wallet Cards
                  </CardTitle>
                  <CardDescription>Delete credit or debit cards from your digital wallet.</CardDescription>
                </CardHeader>
                <CardContent>
                  {walletCards.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No cards found in your wallet.</p>
                  ) : (
                    <div className="space-y-3">
                      {walletCards.map(card => (
                        <div key={card.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{card.name}</p>
                            <p className="text-xs text-muted-foreground">{card.bank} •••• {card.number}</p>
                          </div>
                          <button
                            onClick={() => deleteCard(card.id)}
                            className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-md transition cursor-pointer"
                            title="Delete Card"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-red-500/20 shadow-sm bg-red-500/5">
                <CardHeader>
                  <CardTitle className="text-lg text-red-500 flex items-center gap-2">
                    <Trash2 className="h-5 w-5" />
                    Danger Zone
                  </CardTitle>
                  <CardDescription className="text-red-500/80">
                    Permanently delete all your financial data. This action is irreversible.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 max-w-xl">
                    Once you delete your data, there is no going back. All your transactions, budgets, goals, and customized settings will be wiped immediately.
                  </p>
                  <button 
                    onClick={handleClearData} 
                    disabled={isClearing}
                    className="flex items-center gap-2 bg-red-500 text-white hover:bg-red-600 h-10 px-4 py-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    {isClearing ? "Erasing Data..." : "Clear All Account Data"}
                  </button>
                </CardContent>
              </Card>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
