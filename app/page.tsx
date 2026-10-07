'use client'

import { useState } from 'react'
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Bell,
  ChevronDown,
  FileCheck2,
  FileText,
  LayoutDashboard,
  MoreHorizontal,
  PieChart,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Upload,
  WalletCards,
  X,
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Transactions', icon: FileText },
  { label: 'Analytics', icon: BarChart3 },
  { label: 'Budget', icon: WalletCards },
  { label: 'Audit alerts', icon: ShieldCheck, badge: '3' },
]

const transactions = [
  { merchant: 'Sky Travels', detail: 'Today, 10:24 AM', category: 'Travel', amount: '₹4,571.00', status: 'Verified', tone: 'blue' },
  { merchant: 'Fresh Basket', detail: 'Yesterday, 6:42 PM', category: 'Food', amount: '₹1,284.50', status: 'Verified', tone: 'green' },
  { merchant: 'Urban Co.', detail: '12 Jun 2024, 2:15 PM', category: 'Shopping', amount: '₹2,750.00', status: 'Review', tone: 'amber' },
  { merchant: 'City Utilities', detail: '10 Jun 2024, 9:03 AM', category: 'Bills', amount: '₹3,120.00', status: 'Verified', tone: 'purple' },
]

export default function Page() {
  const [active, setActive] = useState('Dashboard')
  const [showUpload, setShowUpload] = useState(false)

  return (
    <main className="min-h-screen bg-[#f6f8fc] text-[#182337]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[248px] border-r border-[#e5eaf3] bg-white px-5 py-7 lg:block">
        <div className="mb-10 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3155e7] text-white shadow-lg shadow-blue-200"><Sparkles size={20} /></div>
          <div><p className="text-[17px] font-bold tracking-tight">ReceiptMind</p><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#94a0b5]">Intelligence</p></div>
        </div>
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#a4aec0]">Workspace</p>
        <nav className="space-y-1">
          {navItems.map(({ label, icon: Icon, badge }) => <button key={label} onClick={() => setActive(label)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[13px] font-semibold transition ${active === label ? 'bg-[#eef2ff] text-[#3155e7]' : 'text-[#69758a] hover:bg-slate-50'}`}><Icon size={17} strokeWidth={active === label ? 2.5 : 2} /><span className="flex-1">{label}</span>{badge && <span className="rounded-full bg-[#fff0ef] px-2 py-0.5 text-[10px] text-[#e0615b]">{badge}</span>}</button>)}
        </nav>
        <div className="my-8 border-t border-[#edf0f5]" />
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#a4aec0]">Manage</p>
        <button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-semibold text-[#69758a] hover:bg-slate-50"><Settings size={17} /> Settings</button>
        <div className="absolute bottom-7 left-5 right-5 rounded-2xl bg-[#f3f6ff] p-4"><div className="mb-3 flex items-center justify-between"><span className="text-[11px] font-bold text-[#3155e7]">Monthly budget</span><WalletCards size={15} className="text-[#3155e7]" /></div><p className="text-lg font-bold">₹20,000 <span className="text-[11px] font-medium text-[#8d99ae]">/ ₹30,000</span></p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#dce4ff]"><div className="h-full w-[67%] rounded-full bg-[#3155e7]" /></div><p className="mt-2 text-[10px] font-medium text-[#7d89a1]">67% used this month</p></div>
      </aside>

      <section className="lg:ml-[248px]">
        <header className="flex h-[76px] items-center justify-between border-b border-[#e5eaf3] bg-white px-5 sm:px-9"><div><p className="text-[11px] font-semibold text-[#9aa5b8]">Tuesday, 18 June 2024</p><h1 className="mt-1 text-xl font-bold tracking-tight">Good morning, Aarav</h1></div><div className="flex items-center gap-3"><button className="hidden h-10 w-10 items-center justify-center rounded-xl border border-[#e7ebf2] text-[#718096] sm:flex"><Search size={17} /></button><button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#e7ebf2] text-[#718096]"><Bell size={17} /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#e0615b]" /></button><div className="ml-1 flex items-center gap-2 border-l border-[#e7ebf2] pl-4"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dbe5ff] text-xs font-bold text-[#3155e7]">AS</div><div className="hidden sm:block"><p className="text-xs font-bold">Aarav Shah</p><p className="text-[10px] text-[#9aa5b8]">Freelancer</p></div><ChevronDown size={14} className="text-[#98a3b5]" /></div></div></header>
        <div className="mx-auto max-w-[1400px] p-5 sm:p-9">
          <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-1 text-sm font-semibold text-[#3155e7]">Overview</p><h2 className="text-2xl font-bold tracking-tight">Your financial pulse</h2><p className="mt-1 text-sm text-[#8995a9]">Keep your expenses organized and your receipts verified.</p></div><button onClick={() => setShowUpload(true)} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#3155e7] px-5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-[#2646cc]"><Plus size={17} /> Upload receipt</button></div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat label="Total expenses" value="₹20,047.50" change="+12.5%" helper="vs last month" icon={WalletCards} tone="blue" /><Stat label="Receipts verified" value="24" change="+8" helper="this month" icon={FileCheck2} tone="green" /><Stat label="Budget remaining" value="₹9,952.50" change="33%" helper="of monthly budget" icon={PieChart} tone="purple" /><Stat label="Audit alerts" value="3" change="2 high" helper="need your attention" icon={AlertTriangle} tone="red" /></div>
          <div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_1fr]">
            <section className="rounded-2xl border border-[#e5eaf3] bg-white p-5 sm:p-6"><div className="mb-7 flex items-center justify-between"><div><h3 className="font-bold">Spending overview</h3><p className="mt-1 text-xs text-[#98a3b5]">Your expenses over the last 6 months</p></div><button className="flex items-center gap-2 rounded-lg border border-[#e7ebf2] px-3 py-2 text-xs font-semibold text-[#69758a]">Last 6 months <ChevronDown size={13} /></button></div><div className="relative h-[220px] pl-8"><div className="absolute inset-0 flex flex-col justify-between pb-7 text-[10px] text-[#a8b1c1]"><span>₹25k</span><span>₹20k</span><span>₹15k</span><span>₹10k</span><span>₹5k</span><span>₹0</span></div><div className="absolute inset-x-8 top-0 bottom-7 flex flex-col justify-between">{[1,2,3,4,5,6].map(i => <div key={i} className="border-t border-dashed border-[#edf0f5]" />)}</div><svg className="absolute inset-x-8 top-2 h-[185px] w-[calc(100%-2rem)] overflow-visible" preserveAspectRatio="none" viewBox="0 0 600 180" fill="none"><path d="M0 143 C65 126, 90 132, 120 105 S185 115, 225 95 S275 112, 320 75 S380 98, 420 65 S465 90, 510 43 S555 60, 600 25" stroke="#3155e7" strokeWidth="3" vectorEffect="non-scaling-stroke" /><path d="M0 143 C65 126, 90 132, 120 105 S185 115, 225 95 S275 112, 320 75 S380 98, 420 65 S465 90, 510 43 S555 60, 600 25 V180 H0Z" fill="url(#fade)" opacity=".8" /><defs><linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#3155e7" stopOpacity=".18" /><stop offset="1" stopColor="#3155e7" stopOpacity="0" /></linearGradient></defs></svg><div className="absolute inset-x-8 bottom-0 flex justify-between text-[10px] font-medium text-[#a8b1c1]"><span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span></div></div></section>
            <section className="rounded-2xl border border-[#e5eaf3] bg-white p-5 sm:p-6"><div className="mb-6 flex items-start justify-between"><div><h3 className="font-bold">Category breakdown</h3><p className="mt-1 text-xs text-[#98a3b5]">Where your money goes</p></div><button className="text-[#98a3b5]"><MoreHorizontal size={18} /></button></div><div className="flex items-center gap-6"><div className="relative h-36 w-36 shrink-0 rounded-full" style={{background: 'conic-gradient(#3155e7 0 38%, #6d7eea 38% 61%, #f3b74c 61% 79%, #6bc09a 79% 91%, #dfe5f0 91% 100%)'}}><div className="absolute inset-5 flex flex-col items-center justify-center rounded-full bg-white"><span className="text-xl font-bold">₹20k</span><span className="text-[10px] text-[#98a3b5]">total spent</span></div></div><div className="space-y-3 text-xs">{[['Travel','₹7,620','38%','#3155e7'],['Food','₹4,580','23%','#6d7eea'],['Shopping','₹3,610','18%','#f3b74c'],['Bills','₹2,410','12%','#6bc09a'],['Other','₹1,827','9%','#dfe5f0']].map(([name, amount, pct, color]) => <div key={name} className="flex items-center gap-2"><i className="h-2 w-2 rounded-full" style={{backgroundColor: color}} /><span className="w-14 text-[#69758a]">{name}</span><b>{amount}</b><span className="text-[#9aa5b8]">{pct}</span></div>)}</div></div></section>
          </div>
          <div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_1fr]"><section className="rounded-2xl border border-[#e5eaf3] bg-white p-5 sm:p-6"><div className="mb-5 flex items-center justify-between"><div><h3 className="font-bold">Recent transactions</h3><p className="mt-1 text-xs text-[#98a3b5]">Your latest verified expenses</p></div><button className="text-xs font-bold text-[#3155e7]">View all <ArrowUpRight size={13} className="ml-1 inline" /></button></div><div className="overflow-x-auto"><table className="w-full min-w-[580px] text-left text-xs"><thead><tr className="border-b border-[#edf0f5] text-[10px] uppercase tracking-wider text-[#a4aec0]"><th className="pb-3 font-bold">Merchant</th><th className="pb-3 font-bold">Category</th><th className="pb-3 font-bold">Amount</th><th className="pb-3 font-bold">Status</th></tr></thead><tbody>{transactions.map((item) => <tr key={item.merchant} className="border-b border-[#f1f3f7] last:border-0"><td className="py-4"><div className="flex items-center gap-3"><div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-${item.tone === 'blue' ? '[#eef2ff]' : item.tone === 'green' ? '[#e9f8f1]' : item.tone === 'amber' ? '[#fff6e5]' : '[#f1efff]'} text-[10px] font-bold text-[#3155e7]`}>{item.merchant.slice(0,2).toUpperCase()}</div><div><p className="font-bold">{item.merchant}</p><p className="mt-0.5 text-[10px] text-[#9aa5b8]">{item.detail}</p></div></div></td><td className="py-4 text-[#69758a]">{item.category}</td><td className="py-4 font-bold">{item.amount}</td><td className="py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${item.status === 'Verified' ? 'bg-[#eaf8f1] text-[#30916b]' : 'bg-[#fff5df] text-[#c68a25]'}`}>{item.status}</span></td></tr>)}</tbody></table></div></section><section className="rounded-2xl border border-[#e5eaf3] bg-white p-5 sm:p-6"><div className="mb-5 flex items-center justify-between"><div><h3 className="font-bold">Audit alerts</h3><p className="mt-1 text-xs text-[#98a3b5]">Items that need a closer look</p></div><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#fff0ef] text-xs font-bold text-[#e0615b]">3</span></div><div className="space-y-3"><Alert title="Unusual spending detected" detail="Sky Travels · ₹4,571.00" tone="red" /><Alert title="Possible duplicate receipt" detail="Urban Co. · 12 Jun 2024" tone="amber" /><Alert title="Tax calculation mismatch" detail="Fresh Basket · ₹1,284.50" tone="purple" /></div><button className="mt-5 w-full rounded-xl border border-[#e5eaf3] py-2.5 text-xs font-bold text-[#3155e7] hover:bg-[#f7f9ff]">Review all alerts</button></section></div>
        </div>
      </section>
      {showUpload && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#182337]/40 p-5" onClick={() => setShowUpload(false)}><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}><div className="mb-5 flex items-start justify-between"><div><h3 className="text-lg font-bold">Upload a receipt</h3><p className="mt-1 text-xs text-[#8995a9]">JPG, PNG or PDF up to 10 MB</p></div><button onClick={() => setShowUpload(false)} className="text-[#98a3b5]"><X size={18} /></button></div><div className="flex flex-col items-center rounded-xl border-2 border-dashed border-[#dce4ff] bg-[#f8faff] px-5 py-10 text-center"><div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#e9eeff] text-[#3155e7]"><Upload size={21} /></div><p className="text-sm font-bold">Drop your receipt here</p><p className="mt-1 text-xs text-[#98a3b5]">or choose a file from your device</p><button className="mt-5 rounded-lg bg-[#3155e7] px-4 py-2 text-xs font-bold text-white">Choose file</button></div><div className="mt-5 flex items-center gap-2 text-xs text-[#718096]"><ShieldCheck size={15} className="text-[#30916b]" /> Your receipt is securely processed and audited.</div></div></div>}
    </main>
  )
}

function Stat({ label, value, change, helper, icon: Icon, tone }: { label: string; value: string; change: string; helper: string; icon: typeof WalletCards; tone: string }) { const styles: Record<string, string> = { blue: 'bg-[#eef2ff] text-[#3155e7]', green: 'bg-[#eaf8f1] text-[#30916b]', purple: 'bg-[#f1efff] text-[#7565d8]', red: 'bg-[#fff0ef] text-[#e0615b]' }; return <div className="rounded-2xl border border-[#e5eaf3] bg-white p-5"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold text-[#8995a9]">{label}</p><p className="mt-2 text-2xl font-bold tracking-tight">{value}</p></div><div className={`flex h-9 w-9 items-center justify-center rounded-xl ${styles[tone]}`}><Icon size={17} /></div></div><div className="mt-4 flex items-center gap-2 text-[10px]"><span className={`rounded-full px-2 py-1 font-bold ${styles[tone]}`}>{change}</span><span className="text-[#9aa5b8]">{helper}</span></div></div> }
function Alert({ title, detail, tone }: { title: string; detail: string; tone: string }) { const styles: Record<string, string> = { red: 'bg-[#fff0ef] text-[#e0615b]', amber: 'bg-[#fff5df] text-[#c68a25]', purple: 'bg-[#f1efff] text-[#7565d8]' }; return <div className="flex items-center gap-3 rounded-xl border border-[#edf0f5] p-3"><div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${styles[tone]}`}><AlertTriangle size={15} /></div><div className="min-w-0"><p className="truncate text-xs font-bold">{title}</p><p className="mt-1 truncate text-[10px] text-[#98a3b5]">{detail}</p></div><ArrowUpRight size={14} className="ml-auto shrink-0 text-[#a4aec0]" /></div> }
