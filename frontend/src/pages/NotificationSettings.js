import React, { useEffect, useState } from 'react';
import api from '../config/api';

const NotificationSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [prefs, setPrefs] = useState({
    channel: 'email',
    emailEnabled: true,
    smsEnabled: false,
    phone: '',
    timezone: 'UTC',
  });
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/notifications/preferences');
        setPrefs({
          channel: res.data?.channel || 'email',
          emailEnabled: Boolean(res.data?.emailEnabled ?? true),
          smsEnabled: Boolean(res.data?.smsEnabled ?? false),
          phone: res.data?.phone || '',
          timezone: res.data?.timezone || 'UTC',
        });
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await api.put('/notifications/preferences', prefs);
      setMessage('Preferences saved');
    } catch (e) {
      setMessage(e.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const testSend = async () => {
    setTesting(true);
    setMessage(null);
    try {
      const { data } = await api.post('/notifications/test');
      if (data.simulated) {
        setMessage(`Simulated ${data.channel.toUpperCase()} send. Configure env to actually send.`);
      } else {
        setMessage(`Test ${data.channel.toUpperCase()} sent successfully.`);
      }
    } catch (e) {
      setMessage(e.response?.data?.message || 'Test failed');
    } finally {
      setTesting(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading preferences...</div>;

  return (
    <div className="form-container">
      <h2>Notification Settings</h2>
      <form onSubmit={save} className="form">
        <div className="form-group">
          <label>Preferred Channel</label>
          <select
            value={prefs.channel}
            onChange={(e) => setPrefs({ ...prefs, channel: e.target.value })}
          >
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="none">None</option>
          </select>
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={prefs.emailEnabled}
              onChange={(e) => setPrefs({ ...prefs, emailEnabled: e.target.checked })}
            /> Enable Email Notifications
          </label>
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={prefs.smsEnabled}
              onChange={(e) => setPrefs({ ...prefs, smsEnabled: e.target.checked })}
            /> Enable SMS Notifications
          </label>
        </div>

        <div className="form-group">
          <label>Phone (for SMS)</label>
          <input
            type="tel"
            placeholder="+1XXXXXXXXXX"
            value={prefs.phone || ''}
            onChange={(e) => setPrefs({ ...prefs, phone: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Time Zone</label>
          <input
            type="text"
            placeholder="UTC"
            value={prefs.timezone}
            onChange={(e) => setPrefs({ ...prefs, timezone: e.target.value })}
          />
        </div>

        <div className="form-actions">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
          <button type="button" onClick={testSend} disabled={testing} className="btn-secondary" style={{ marginLeft: 8 }}>
            {testing ? 'Sending...' : 'Send Test'}
          </button>
        </div>
      </form>
      {message && (
        <div style={{ marginTop: 12 }}>
          {message}
        </div>
      )}
    </div>
  );
};

export default NotificationSettings;


