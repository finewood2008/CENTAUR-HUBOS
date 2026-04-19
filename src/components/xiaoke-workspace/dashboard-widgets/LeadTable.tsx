// 线索管理表格
import { Mail, Phone, MessageSquare, MoreHorizontal } from 'lucide-react';

export interface Lead {
  id: string;
  name: string;
  company: string;
  source: string;
  stage: '新线索' | '跟进中' | '意向' | '成交' | '流失';
  score: number;
  lastContact: string;
}

const DEMO_LEADS: Lead[] = [
  { id: '1', name: '张总', company: '深圳明远科技', source: '百度SEM', stage: '跟进中', score: 85, lastContact: '2小时前' },
  { id: '2', name: '李经理', company: '杭州云图数据', source: '小红书', stage: '意向', score: 72, lastContact: '1天前' },
  { id: '3', name: '王总监', company: '上海锐创', source: '内容营销', stage: '新线索', score: 65, lastContact: '3天前' },
  { id: '4', name: '陈总', company: '北京智行', source: '老客推荐', stage: '成交', score: 95, lastContact: '1周前' },
  { id: '5', name: '刘经理', company: '成都方圆', source: '邮件营销', stage: '流失', score: 30, lastContact: '2周前' },
];

const stageColors: Record<string, string> = {
  '新线索': 'bg-blue-500/12 text-blue-600',
  '跟进中': 'bg-amber-500/12 text-amber-600',
  '意向': 'bg-cyan-500/12 text-cyan-600',
  '成交': 'bg-green-500/12 text-green-600',
  '流失': 'bg-stone-400/12 text-stone-gray',
};

export default function LeadTable({ leads = DEMO_LEADS }: { leads?: Lead[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border-cream text-stone-gray">
            <th className="text-left py-2 px-2 font-medium">线索</th>
            <th className="text-left py-2 px-2 font-medium">来源</th>
            <th className="text-left py-2 px-2 font-medium">阶段</th>
            <th className="text-center py-2 px-2 font-medium">评分</th>
            <th className="text-right py-2 px-2 font-medium">操作</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id} className="border-b border-border-cream/50 hover:bg-warm-sand/30 transition-colors">
              <td className="py-2.5 px-2">
                <p className="text-near-black font-medium">{lead.name}</p>
                <p className="text-[10px] text-stone-gray">{lead.company}</p>
              </td>
              <td className="py-2.5 px-2 text-olive-gray">{lead.source}</td>
              <td className="py-2.5 px-2">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${stageColors[lead.stage] || ''}`}>
                  {lead.stage}
                </span>
              </td>
              <td className="py-2.5 px-2 text-center">
                <span className={`font-medium ${lead.score >= 80 ? 'text-green-600' : lead.score >= 50 ? 'text-amber-600' : 'text-stone-gray'}`}>
                  {lead.score}
                </span>
              </td>
              <td className="py-2.5 px-2">
                <div className="flex items-center justify-end gap-1">
                  <button className="p-1 rounded hover:bg-warm-sand transition-colors" title="邮件"><Mail size={12} className="text-olive-gray" /></button>
                  <button className="p-1 rounded hover:bg-warm-sand transition-colors" title="电话"><Phone size={12} className="text-olive-gray" /></button>
                  <button className="p-1 rounded hover:bg-warm-sand transition-colors" title="消息"><MessageSquare size={12} className="text-olive-gray" /></button>
                  <button className="p-1 rounded hover:bg-warm-sand transition-colors" title="更多"><MoreHorizontal size={12} className="text-olive-gray" /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
