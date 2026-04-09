"use client"
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  Settings, 
  Map as MapIcon, 
  FileText, 
  UserCircle,
  HelpCircle,
  ShieldCheck,
  Zap
} from "lucide-react"

const modules = [
  {
    title: "Dashboard Executivo",
    icon: <LayoutDashboard className="text-accent" size={24} />,
    desc: "Visão consolidada da operação, KPIs financeiros (arrecadação, gastos, projeção) e indicadores operacionais (capacidade, frota, pendências).",
    features: ["KPIs em tempo real", "Status de frota", "Alertas críticos", "Resumo financeiro"]
  },
  {
    title: "Gestão de Locações",
    icon: <Truck className="text-blue-500" size={24} />,
    desc: "Fluxo completo de aluguel de caçambas, desde a entrega até a retirada e cobrança final.",
    features: ["Cadastro rápido de novos clientes", "Detecção de duplicidade CPF/CNPJ", "Geração de recibos", "Controle de status operacionais"]
  },
  {
    title: "Centro de Clientes",
    icon: <Users className="text-emerald-500" size={24} />,
    desc: "Gestão completa da base de parceiros e locadores, com histórico de pedidos e dados de contato.",
    features: ["Vínculo com contratos", "Histórico financeiro por cliente", "Filtros avançados", "Edição rápida"]
  },
  {
    title: "Mapa de Pátio",
    icon: <MapIcon className="text-indigo-500" size={24} />,
    desc: "Monitoramento geográfico em tempo real de todas as caçambas distribuídas na cidade.",
    features: ["Filtros por status", "Localização via geocoding", "Itinerário de logística", "Visualização por satélite"]
  },
  {
    title: "Gerenciamento de Ativos",
    icon: <Settings className="text-amber-500" size={24} />,
    desc: "Configuração da frota de caçambas e controle físico de ativos.",
    features: ["Inventário", "Manutenção (em breve)", "Códigos de identificação", "Status de pátio"]
  },
  {
    title: "Relatórios & BI",
    icon: <FileText className="text-slate-500" size={24} />,
    desc: "Análise detalhada de faturamento, despesas operacionais e performance de negócio.",
    features: ["Exportação de dados", "BI básico", "Controle de gastos", "Fluxo de caixa"]
  }
]

export default function DocumentacoesPage() {
  return (
    <div className="space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* HEADER SECTION */}
      <div className="max-w-3xl space-y-4">
        <h2 className="text-4xl font-black tracking-tighter text-foreground italic flex items-center gap-4">
          <HelpCircle size={40} className="text-accent" />
          Guia do <span className="text-accent">Sistema</span>
        </h2>
        <p className="text-lg text-muted-foreground font-medium">
          Bem-vindo ao centro de documentação do CaçambaGo. Aqui você encontrará detalhes sobre como operar cada módulo da plataforma para maximizar sua eficiência logística.
        </p>
      </div>

      {/* CORE MODULES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {modules.map((m, idx) => (
          <Card key={idx} className="group border border-white/5 bg-card/50 backdrop-blur-sm rounded-[32px] overflow-hidden hover:shadow-2xl transition-all hover:-translate-y-2">
            <CardHeader className="p-8 pb-4">
               <div className="w-14 h-14 rounded-2xl bg-muted/20 flex items-center justify-center mb-4 group-hover:bg-accent/10 transition-colors">
                  {m.icon}
               </div>
               <CardTitle className="text-xl font-black italic tracking-tight">{m.title}</CardTitle>
            </CardHeader>
            <CardContent className="px-8 pb-8 space-y-6">
               <p className="text-sm text-muted-foreground font-medium leading-relaxed italic border-l-2 border-accent/20 pl-4">
                 "{m.desc}"
               </p>
               <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-accent/60">Principais Recursos</p>
                  <ul className="grid grid-cols-1 gap-1.5">
                    {m.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-center gap-2 text-xs font-bold text-foreground/80">
                         <div className="w-1 h-1 rounded-full bg-accent" />
                         {feat}
                      </li>
                    ))}
                  </ul>
               </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* SECURITY & PERFORMANCE SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
         <Card className="bg-slate-900 border-none rounded-[40px] p-10 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 blur-[100px] pointer-events-none" />
            <div className="relative z-10 space-y-6">
               <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-3xl bg-white/10 flex items-center justify-center">
                    <ShieldCheck size={28} className="text-accent" />
                  </div>
                  <h3 className="text-2xl font-black italic tracking-tighter">Segurança Enterprise</h3>
               </div>
               <p className="text-slate-400 font-medium leading-relaxed italic">
                 O sistema utiliza criptografia de ponta a ponta para proteger os dados de seus clientes. Todo fluxo financeiro é auditado e os acessos são controlados via Supabase Auth com persistência segura.
               </p>
               <div className="flex gap-4">
                  <div className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-[10px] font-bold uppercase tracking-widest">TLS 1.3</div>
                  <div className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-[10px] font-bold uppercase tracking-widest">JWT Auth</div>
               </div>
            </div>
         </Card>

         <Card className="bg-background border border-border/50 rounded-[40px] p-10 relative overflow-hidden group shadow-xl">
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 blur-[100px] pointer-events-none" />
            <div className="relative z-10 space-y-6">
               <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-3xl bg-emerald-500/10 flex items-center justify-center">
                    <Zap size={28} className="text-emerald-500" />
                  </div>
                  <h3 className="text-2xl font-black italic tracking-tighter">Performance SaaS</h3>
               </div>
               <p className="text-muted-foreground font-medium leading-relaxed italic border-l-2 border-emerald-500/20 pl-4">
                 Arquitetura Next.js com carregamento dinâmico de componentes e otimização de renderização no lado do cliente. O mapa Leaflet foi estabilizado para performance fluida em dispositivos móveis.
               </p>
               <div className="flex gap-4">
                  <div className="px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold uppercase tracking-widest">Core Web Vitals</div>
                  <div className="px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold uppercase tracking-widest">99.9% Uptime</div>
               </div>
            </div>
         </Card>
      </div>

      {/* FOOTER CALL TO ACTION */}
      <div className="text-center py-12 space-y-4">
        <p className="text-xs font-black uppercase tracking-[0.4em] text-muted-foreground">CaçambaGo v1.2 — Professional Logístics Engine</p>
        <div className="flex justify-center gap-6">
          <span className="text-[10px] font-bold text-muted-foreground italic flex items-center gap-2">
            <UserCircle size={14} /> Suporte Corporativo
          </span>
          <span className="text-[10px] font-bold text-muted-foreground italic flex items-center gap-2">
            <Zap size={14} /> Atualizações Automáticas
          </span>
        </div>
      </div>
    </div>
  )
}
