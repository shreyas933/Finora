const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', '(app)', 'settings', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add CreditCard to lucide-react imports if not there
if (!content.includes('CreditCard,')) {
    content = content.replace('Settings as SettingsIcon, ', 'Settings as SettingsIcon, CreditCard, ');
}

// 2. Add walletCards state
const stateHookStr = `  const [activeTab, setActiveTab] = useState("profile");`;
const newStateStr = `  const [activeTab, setActiveTab] = useState("profile");
  const [walletCards, setWalletCards] = useState<any[]>([]);`;

if (!content.includes('const [walletCards, setWalletCards] = useState')) {
    content = content.replace(stateHookStr, newStateStr);
}

// 3. Add useEffect content
const effectStr = `  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setEmail(user.email || "");
        setFirstName(user.user_metadata?.first_name || "");
        setLastName(user.user_metadata?.last_name || "");
      }
    });
  }, []);`;
  
const newEffectStr = `  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setEmail(user.email || "");
        setFirstName(user.user_metadata?.first_name || "");
        setLastName(user.user_metadata?.last_name || "");
      }
    });

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
  };`;

if (!content.includes('const deleteCard')) {
    content = content.replace(effectStr, newEffectStr);
}

// 4. Add the Manage Wallet Cards card inside the data tab
const dataTabEndStr = `                <CardContent>
                  <button className="flex items-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors">
                    <Download className="h-4 w-4" />
                    Export as CSV
                  </button>
                </CardContent>
              </Card>`;
              
const newDataTabEndStr = `                <CardContent>
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
              </Card>`;

if (!content.includes('Manage Wallet Cards')) {
    content = content.replace(dataTabEndStr, newDataTabEndStr);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Settings page updated.');
