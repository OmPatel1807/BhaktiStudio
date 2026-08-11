import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WORKER_SKILLS } from '../../types';

export const WorkerRegistration = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    experienceYrs: 3,
    specialization: ['LED_TECHNICIAN'],
    avatarUrl: '',
  });

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isOtherSelected, setIsOtherSelected] = useState(false);
  const [customRoleText, setCustomRoleText] = useState('');
  const [photoError, setPhotoError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
        setFormData((prev) => ({ ...prev, avatarUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleSkillSelection = (skillKey) => {
    if (formData.specialization.includes(skillKey)) {
      setFormData({
        ...formData,
        specialization: formData.specialization.filter((s) => s !== skillKey),
      });
    } else {
      setFormData({
        ...formData,
        specialization: [...formData.specialization, skillKey],
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!avatarPreview && !formData.avatarUrl) {
      setPhotoError('Worker Profile Photo * (Required) is mandatory. Please select a profile photo.');
      return;
    }

    let finalSpecializations = [...formData.specialization];
    if (isOtherSelected && customRoleText.trim()) {
      finalSpecializations.push(customRoleText.trim());
    }

    if (finalSpecializations.length === 0) {
      setErrorMsg('Please select at least one specialization or skill.');
      return;
    }

    const payload = {
      ...formData,
      specialization: finalSpecializations,
    };

    setSubmitting(true);

    try {
      const res = await fetch('/api/v1/workers/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      setSubmitting(false);

      if (json.success) {
        setSuccessModal(true);
      } else {
        setErrorMsg(json.message || 'Failed to submit application.');
      }
    } catch (err) {
      setSubmitting(false);
      setErrorMsg('Network error submitting application. Please try again.');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        padding: '40px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: 'Inter, system-ui, sans-serif',
        transition: 'background-color 0.3s ease, color 0.3s ease',
      }}
    >
      {/* Header Banner */}
      <div style={{ maxWidth: '640px', width: '100%', textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#C39B5A', margin: '0 0 10px 0' }}>
          👷 Join Bhakti Studio Crew
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px', margin: 0, lineHeight: '1.5' }}>
          Apply to join our professional event production, LED rental, and audio-visual engineering team.
        </p>
      </div>

      {/* Main Registration Card */}
      <div
        style={{
          maxWidth: '640px',
          width: '100%',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '24px',
          padding: '36px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
          transition: 'all 0.3s ease',
        }}
      >
        {errorMsg && (
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#EF4444',
              border: '1px solid #EF4444',
              padding: '14px 18px',
              borderRadius: '14px',
              marginBottom: '24px',
              fontSize: '14px',
              fontWeight: '700',
            }}
          >
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Mandatory Profile Photo Upload */}
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '800', color: '#C39B5A', marginBottom: '12px' }}>
              Worker Profile Photo * (Required)
            </label>
            <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 14px auto' }}>
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Worker Preview"
                  style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #C39B5A' }}
                />
              ) : (
                <div
                  style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-input)',
                    border: photoError ? '2px dashed #EF4444' : '2px dashed #C39B5A',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-secondary)',
                    fontSize: '32px',
                  }}
                >
                  📷
                </div>
              )}
            </div>
            <label
              style={{
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                fontSize: '13px',
                fontWeight: '700',
                padding: '10px 20px',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'inline-block',
              }}
            >
              📷 Upload Profile Photo *
              <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
            </label>
            {photoError && (
              <div style={{ fontSize: '12px', color: '#EF4444', marginTop: '8px', fontWeight: '700' }}>
                ⚠️ {photoError}
              </div>
            )}
          </div>

          {/* Full Name */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Full Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Ramesh Kumar"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '14px',
                boxSizing: 'border-box',
                fontSize: '14px',
              }}
            />
          </div>

          {/* Email & Phone */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Email Address *
              </label>
              <input
                type="email"
                placeholder="tech@bhaktistudio.com"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '14px',
                  boxSizing: 'border-box',
                  fontSize: '14px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Phone Number *
              </label>
              <input
                type="text"
                placeholder="+91 98765 43210"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '14px',
                  boxSizing: 'border-box',
                  fontSize: '14px',
                }}
              />
            </div>
          </div>

          {/* Experience in Years */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Experience in Years *
            </label>
            <input
              type="number"
              min="0"
              max="50"
              step="0.5"
              placeholder="Experience in Years (e.g. 3 Years)"
              required
              value={formData.experienceYrs}
              onChange={(e) => setFormData({ ...formData, experienceYrs: e.target.value })}
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '14px',
                boxSizing: 'border-box',
                fontSize: '14px',
              }}
            />
          </div>

          {/* Specialization Chips + "+ Other" Option */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px', fontWeight: '700' }}>
              Select Specializations / Skills *
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              {Object.entries(WORKER_SKILLS).map(([key, label]) => {
                const isSel = formData.specialization.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleSkillSelection(key)}
                    style={{
                      backgroundColor: isSel ? '#C39B5A' : 'var(--bg-input)',
                      color: isSel ? '#FFFFFF' : 'var(--text-primary)',
                      border: isSel ? '1px solid #C39B5A' : '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '8px 14px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setIsOtherSelected(!isOtherSelected)}
                style={{
                  backgroundColor: isOtherSelected ? '#C39B5A' : 'var(--bg-input)',
                  color: isOtherSelected ? '#FFFFFF' : '#C39B5A',
                  border: '1px solid #C39B5A',
                  borderRadius: '10px',
                  padding: '8px 14px',
                  fontSize: '13px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                + Other
              </button>
            </div>

            {isOtherSelected && (
              <input
                type="text"
                placeholder="Enter custom role/skill (e.g. Drone Pilot, DIT Tech)..."
                value={customRoleText}
                onChange={(e) => setCustomRoleText(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  border: '1px solid #C39B5A',
                  borderRadius: '12px',
                  padding: '14px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              backgroundColor: '#C39B5A',
              color: '#FFFFFF',
              fontWeight: '900',
              fontSize: '16px',
              border: 'none',
              borderRadius: '14px',
              padding: '16px',
              cursor: 'pointer',
              marginTop: '10px',
              boxShadow: '0 6px 18px rgba(195, 155, 90, 0.3)',
              transition: 'all 0.2s ease',
            }}
          >
            {submitting ? 'Submitting Application...' : '🚀 Submit Crew Application'}
          </button>
        </form>
      </div>

      {/* Success Modal */}
      {successModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid #10B981',
              borderRadius: '24px',
              padding: '36px',
              maxWidth: '480px',
              width: '90%',
              textAlign: 'center',
              color: 'var(--text-primary)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
            <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#10B981', margin: '0 0 12px 0' }}>
              Application Submitted!
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.6', margin: '0 0 24px 0' }}>
              Admin will review and activate your account shortly. You will be able to log in to the Worker Portal once approved.
            </p>
            <button
              onClick={() => navigate('/login')}
              style={{
                backgroundColor: '#C39B5A',
                color: '#FFFFFF',
                fontWeight: '900',
                border: 'none',
                borderRadius: '12px',
                padding: '14px 28px',
                fontSize: '15px',
                cursor: 'pointer',
              }}
            >
              Go to Sign In Gateway
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
