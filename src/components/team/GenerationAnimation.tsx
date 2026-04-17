// GenerationAnimation — 数字员工生成动画（5步骤）
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Brain, MessageSquare, Wrench, Database, Check, Sparkles } from 'lucide-react';
import type { EmployeeSpec } from '../../types';

interface Props {
  spec: EmployeeSpec;
  onComplete: () => void;
}

const STEPS = [
  { label: '设定角色定位', icon: User, detail: '分析业务需求，匹配最佳角色模型...' },
  { label: '配置核心能力', icon: Brain, detail: '加载专业技能树，优化知识图谱...' },
  { label: '调优沟通风格', icon: MessageSquare, detail: '校准语言模式，适配企业文化...' },
  { label: '装配工具集', icon: Wrench, detail: '连接业务系统，配置API接口...' },
  { label: '初始化记忆系统', icon: Database, detail: '构建长期记忆层，建立认知基线...' },
];

const STEP_DURATION = 1500;

export default function GenerationAnimation({ spec, onComplete }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState<number[]>([]);

  useEffect(() => {
    if (currentStep < STEPS.length) {
      const timer = setTimeout(() => {
        setCompleted((prev) => [...prev, currentStep]);
        setCurrentStep((prev) => prev + 1);
      }, STEP_DURATION);
      return () => clearTimeout(timer);
    } else {
      const finishTimer = setTimeout(onComplete, 800);
      return () => clearTimeout(finishTimer);
    }
  }, [currentStep, onComplete]);

  const progress = ((completed.length) / STEPS.length) * 100;
  const allDone = completed.length === STEPS.length;

  return (
    <div className="flex-1 flex items-center justify-center bg-parchment">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: allDone ? 0 : 360 }}
            transition={{ duration: 2, repeat: allDone ? 0 : Infinity, ease: 'linear' }}
            className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-terracotta to-coral flex items-center justify-center shadow-lg"
          >
            {allDone ? (
              <Check size={28} className="text-white" />
            ) : (
              <Sparkles size={28} className="text-white" />
            )}
          </motion.div>
          <h2 className="font-serif text-xl text-near-black">
            {allDone ? `${spec.name || '新员工'} 已就绪` : `正在打造 ${spec.name || '新员工'}...`}
          </h2>
          <p className="text-sm text-stone-gray mt-1">
            {allDone ? '数字员工创建成功，可以开始工作了' : '请稍候，正在配置您的数字员工'}
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="h-1.5 bg-warm-sand rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-terracotta to-coral rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-stone-gray">{Math.round(progress)}%</span>
            <span className="text-[10px] text-stone-gray">{completed.length}/{STEPS.length} 步骤</span>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {STEPS.map((step, i) => {
            const isDone = completed.includes(i);
            const isActive = currentStep === i && !isDone;
            const Icon = step.icon;

            return (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1, duration: 0.3 }}
                className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 ${
                  isDone
                    ? 'bg-success-green/8 border border-success-green/15'
                    : isActive
                      ? 'bg-terracotta/8 border border-terracotta/20 shadow-sm'
                      : 'bg-warm-sand/30 border border-border-cream'
                }`}
              >
                {/* Icon */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300 ${
                    isDone
                      ? 'bg-success-green/15'
                      : isActive
                        ? 'bg-terracotta/15'
                        : 'bg-warm-sand/60'
                  }`}
                >
                  {isDone ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    >
                      <Check size={18} className="text-success-green" />
                    </motion.div>
                  ) : isActive ? (
                    <motion.div
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <Icon size={18} className="text-terracotta" />
                    </motion.div>
                  ) : (
                    <Icon size={18} className="text-stone-gray" />
                  )}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium transition-colors ${
                      isDone
                        ? 'text-success-green'
                        : isActive
                          ? 'text-near-black'
                          : 'text-stone-gray'
                    }`}
                  >
                    {step.label}
                  </p>
                  <AnimatePresence>
                    {isActive && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-[11px] text-olive-gray mt-0.5"
                      >
                        {step.detail}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Status */}
                {isActive && (
                  <div className="flex gap-1 shrink-0">
                    {[0, 1, 2].map((d) => (
                      <motion.span
                        key={d}
                        className="w-1.5 h-1.5 rounded-full bg-terracotta"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: d * 0.2 }}
                      />
                    ))}
                  </div>
                )}
                {isDone && (
                  <span className="text-[10px] text-success-green font-medium shrink-0">完成</span>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Spec preview at bottom */}
        {spec.capabilities && spec.capabilities.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 flex flex-wrap gap-1.5 justify-center"
          >
            {spec.capabilities.slice(0, 6).map((c) => (
              <span
                key={c}
                className="px-2 py-0.5 rounded-md bg-terracotta/8 text-[10px] text-terracotta"
              >
                {c}
              </span>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
