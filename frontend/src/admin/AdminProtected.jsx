import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { isAdminLoggedIn, refreshAdminSession, adminLogout } from '../api/adminApi';

export default function AdminProtected() {
  const loggedIn = isAdminLoggedIn();
  const [ready, setReady] = useState(!loggedIn);
  const [ok, setOk] = useState(loggedIn);

  useEffect(() => {
    let cancelled = false;
    if (!isAdminLoggedIn()) {
      setOk(false);
      setReady(true);
      return undefined;
    }

    (async () => {
      const session = await refreshAdminSession();
      if (cancelled) return;
      if (session === null) {
        adminLogout();
        setOk(false);
      } else {
        // success or deferred (API temporarily down during deploy)
        setOk(true);
      }
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div className="dash-page" style={{ padding: '2rem', textAlign: 'center' }}>
        جاري التحقق من الجلسة...
      </div>
    );
  }

  if (!ok) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
