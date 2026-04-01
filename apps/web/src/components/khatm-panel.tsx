'use client';

import { useEffect, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { createKhatmGroup, joinKhatmGroup, markKhatmPageDone, subscribeKhatmGroup, subscribeMyKhatmMemberships } from '@/lib/firebase';

type Membership = {
  id: string;
  groupId: string;
  completedPages: number[];
  assignedPages: number[];
};

export function KhatmPanel() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [message, setMessage] = useState('');
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [activeGroup, setActiveGroup] = useState<{ name: string; inviteCode: string; totalPagesDone: number } | null>(null);

  useEffect(() => {
    if (!user || user.isAnonymous) return;
    const unsubscribe = subscribeMyKhatmMemberships(user.uid, (items) => {
      setMemberships(items);
    });
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!memberships[0]?.groupId) return;
    const unsubscribe = subscribeKhatmGroup(memberships[0].groupId, (payload) => {
      setActiveGroup(payload);
    });
    return unsubscribe;
  }, [memberships]);

  if (!user || user.isAnonymous) {
    return <p className="body-copy">يحتاج هذا القسم إلى تسجيل دخول حقيقي حتى تعمل المجموعات والمزامنة.</p>;
  }

  const currentUser = user;

  async function createGroupAction() {
    try {
      const group = await createKhatmGroup(currentUser.uid, name.trim());
      setMessage(`تم إنشاء المجموعة. رمز الدعوة: ${group.inviteCode}`);
      setInviteCode(group.inviteCode);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر إنشاء المجموعة.');
    }
  }

  async function joinGroupAction() {
    try {
      await joinKhatmGroup(currentUser.uid, inviteCode);
      setMessage('تم الانضمام إلى المجموعة بنجاح.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر الانضمام.');
    }
  }

  return (
    <div className="settings-shell">
      <section className="feature-card">
        <p className="feature-eyebrow">إنشاء</p>
        <h3>أنشئ ختمة جديدة</h3>
        <div className="inline-field-row two-fields">
          <input className="text-field" dir="rtl" placeholder="اسم المجموعة" value={name} onChange={(e) => setName(e.target.value)} />
          <button className="primary-button" onClick={() => void createGroupAction()} disabled={!name.trim()}>إنشاء</button>
        </div>
      </section>

      <section className="feature-card">
        <p className="feature-eyebrow">انضمام</p>
        <h3>ادخل رمز الدعوة</h3>
        <div className="inline-field-row two-fields">
          <input className="text-field" dir="ltr" placeholder="NOOR42" value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} />
          <button className="ghost-button" onClick={() => void joinGroupAction()} disabled={!inviteCode.trim()}>انضم</button>
        </div>
      </section>

      {activeGroup ? (
        <section className="feature-card">
          <p className="feature-eyebrow">المجموعة الحالية</p>
          <h3>{activeGroup.name}</h3>
          <p className="body-copy">الرمز: {activeGroup.inviteCode || inviteCode}</p>
          <p className="body-copy">التقدم الكلي: {activeGroup.totalPagesDone} / 604</p>
          <div className="score-track"><div className="score-fill" style={{ width: `${Math.max(2, Math.round((activeGroup.totalPagesDone / 604) * 100))}%` }} /></div>
          <p className="body-copy">صفحاتك المنجزة: {memberships[0]?.completedPages.length ?? 0} / {memberships[0]?.assignedPages.length ?? 0}</p>
          <div className="chip-row">
            {(memberships[0]?.assignedPages ?? []).slice(0, 20).map((page) => (
              <button key={page} className="ghost-button" onClick={() => void markKhatmPageDone(memberships[0]!.groupId, currentUser.uid, page)}>
                ص {page}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {memberships.length > 1 ? (
        <section className="feature-card">
          <p className="feature-eyebrow">عضوياتك</p>
          <h3>المجموعات المرتبطة بك</h3>
          <div className="result-list">
            {memberships.map((item) => (
              <article key={item.id} className="result-item compact-result">
                <div className="result-meta">
                  <span>{item.groupId}</span>
                  <span>{item.completedPages.length}/{item.assignedPages.length}</span>
                </div>
                <p className="body-copy">وثيقة العضوية: {item.id}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {message ? <p className="panel-note">{message}</p> : null}
    </div>
  );
}
