import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/formatters';

export const CatalogManager = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'equipment' | 'settings'

  // Service Catalog State
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [newService, setNewService] = useState({
    name: '',
    category: 'Display',
    description: '',
    pricingModel: 'AREA_BASED',
    baseRate: 150,
    setupCharge: 2000,
  });
  const [showEditServiceModal, setShowEditServiceModal] = useState(false);
  const [editingService, setEditingService] = useState(null);

  // Equipment Tracking State
  const [equipment, setEquipment] = useState([]);
  const [loadingEquipment, setLoadingEquipment] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [newAsset, setNewAsset] = useState({
    assetTag: '',
    serviceId: '',
    condition: 'EXCELLENT',
    status: 'AVAILABLE',
  });

  // Business Settings State
  const [settings, setSettings] = useState({
    baseLedSqFtRate: 150,
    defaultSetupFee: 2000,
    defaultTransportRate: 50,
    taxPercentage: 18,
    advancePayPercentage: 30,
  });
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Global Notification Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch Services
  const fetchServices = async () => {
    setLoadingServices(true);
    try {
      const res = await fetch('/api/v1/services', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setServices(json.data);
    } catch (err) {
      showToast('Failed to fetch services catalog', 'error');
    } finally {
      setLoadingServices(false);
    }
  };

  // Fetch Equipment
  const fetchEquipment = async () => {
    setLoadingEquipment(true);
    try {
      const url = statusFilter ? `/api/v1/equipment?status=${statusFilter}` : '/api/v1/equipment';
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setEquipment(json.data);
    } catch (err) {
      showToast('Failed to fetch equipment inventory', 'error');
    } finally {
      setLoadingEquipment(false);
    }
  };

  // Fetch Settings
  const fetchSettings = async () => {
    setLoadingSettings(true);
    try {
      const res = await fetch('/api/v1/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setSettings(json.data);
    } catch (err) {
      showToast('Failed to load business settings', 'error');
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'catalog') fetchServices();
    if (activeTab === 'equipment') fetchEquipment();
    if (activeTab === 'settings') fetchSettings();
  }, [activeTab, statusFilter]);

  // Handlers for Catalog
  const handleToggleServiceActive = async (id, currentStatus) => {
    try {
      const res = await fetch(`/api/v1/services/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Service ${!currentStatus ? 'activated' : 'deactivated'}`);
        fetchServices();
      } else {
        showToast(json.message, 'error');
      }
    } catch (err) {
      showToast('Failed to update service status', 'error');
    }
  };

  const handleCreateService = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newService),
      });
      const json = await res.json();
      if (json.success) {
        showToast('New service item added to catalog');
        setShowAddServiceModal(false);
        setNewService({
          name: '',
          category: 'Display',
          description: '',
          pricingModel: 'AREA_BASED',
          baseRate: 150,
          setupCharge: 2000,
        });
        fetchServices();
      } else {
        showToast(json.message, 'error');
      }
    } catch (err) {
      showToast('Failed to create service item', 'error');
    }
  };

  const handleUpdateService = async (e) => {
    e.preventDefault();
    if (!editingService) return;
    try {
      const res = await fetch(`/api/v1/services/${editingService.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingService),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Service '${editingService.name}' updated successfully`);
        setShowEditServiceModal(false);
        setEditingService(null);
        fetchServices();
      } else {
        showToast(json.message, 'error');
      }
    } catch (err) {
      showToast('Failed to update service item', 'error');
    }
  };

  const handleDeleteService = async (id, name) => {
    if (!window.confirm(`Are you sure you want to archive/deactivate service '${name}'?`)) return;
    try {
      const res = await fetch(`/api/v1/services/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Service '${name}' archived successfully`);
        fetchServices();
      } else {
        showToast(json.message, 'error');
      }
    } catch (err) {
      showToast('Failed to archive service item', 'error');
    }
  };

  // Handlers for Equipment
  const handleCreateAsset = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/equipment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newAsset),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Physical asset '${newAsset.assetTag}' registered`);
        setShowAddAssetModal(false);
        setNewAsset({ assetTag: '', serviceId: '', condition: 'EXCELLENT', status: 'AVAILABLE' });
        fetchEquipment();
      } else {
        showToast(json.message, 'error');
      }
    } catch (err) {
      showToast('Failed to register asset', 'error');
    }
  };

  const handleUpdateAssetStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/v1/equipment/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Asset status updated to ${newStatus}`);
        fetchEquipment();
      } else {
        showToast(json.message, 'error');
      }
    } catch (err) {
      showToast('Failed to update asset status', 'error');
    }
  };

  // Handler for Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch('/api/v1/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });
      const json = await res.json();
      if (json.success) {
        showToast('Business settings & default rates saved');
      } else {
        showToast(json.message, 'error');
      }
    } catch (err) {
      showToast('Failed to save settings', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0F172A', // Obsidian Dark
        color: '#F8FAFC',
        padding: '32px 24px',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: toast.type === 'error' ? '#EF4444' : '#10B981',
            color: '#FFFFFF',
            padding: '12px 24px',
            borderRadius: '12px',
            fontWeight: '600',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)',
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div style={{ maxWidth: '1200px', margin: '0 auto 32px auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0, color: '#F8FAFC' }}>
              Catalog & Engine Management
            </h1>
            <p style={{ color: '#94A3B8', fontSize: '14px', margin: '4px 0 0 0' }}>
              Master pricing, service items, physical equipment assets, and business settings rules.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {activeTab === 'catalog' && (
              <button
                type="button"
                onClick={() => setShowAddServiceModal(true)}
                style={{
                  backgroundColor: '#F59E0B',
                  color: '#0F172A',
                  fontWeight: '700',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                + Add Service
              </button>
            )}
            {activeTab === 'equipment' && (
              <button
                type="button"
                onClick={() => setShowAddAssetModal(true)}
                style={{
                  backgroundColor: '#F59E0B',
                  color: '#0F172A',
                  fontWeight: '700',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                + Register Asset
              </button>
            )}
          </div>
        </div>

        {/* Tabs Bar */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            borderBottom: '1px solid #334155',
            marginTop: '24px',
          }}
        >
          {[
            { id: 'catalog', label: '📦 Service Catalog' },
            { id: 'equipment', label: '🧰 Physical Equipment Tracker' },
            { id: 'settings', label: '⚙️ Business Settings Engine' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '3px solid #F59E0B' : '3px solid transparent',
                  color: isActive ? '#F59E0B' : '#94A3B8',
                  fontWeight: '700',
                  fontSize: '15px',
                  padding: '12px 16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* TAB 1: SERVICE CATALOG */}
        {activeTab === 'catalog' && (
          <div>
            {loadingServices ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
                Loading service catalog...
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                  gap: '20px',
                }}
              >
                {services.map((svc) => (
                  <div
                    key={svc.id}
                    style={{
                      backgroundColor: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: '16px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      opacity: svc.isActive ? 1 : 0.6,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '8px',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            color: '#F59E0B',
                            backgroundColor: 'rgba(245,158,11,0.1)',
                            padding: '4px 10px',
                            borderRadius: '6px',
                          }}
                        >
                          {svc.category} • {svc.pricingModel}
                        </span>

                        {/* Active Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleServiceActive(svc.id, svc.isActive)}
                          style={{
                            backgroundColor: svc.isActive ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                            color: svc.isActive ? '#10B981' : '#EF4444',
                            border: 'none',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                          }}
                        >
                          {svc.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </button>
                      </div>

                      <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '8px 0 4px 0' }}>
                        {svc.name}
                      </h3>
                      <p style={{ fontSize: '13px', color: '#94A3B8', margin: '0 0 16px 0' }}>
                        {svc.description || 'No description provided.'}
                      </p>
                    </div>

                    <div
                      style={{
                        borderTop: '1px solid #334155',
                        paddingTop: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>Base Rate</div>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: '#F8FAFC' }}>
                          {formatCurrency(svc.baseRate)}{' '}
                          <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '400' }}>
                            {svc.pricingModel === 'AREA_BASED' ? '/ sq ft' : ''}
                          </span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>Setup Fee</div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#94A3B8' }}>
                          {formatCurrency(svc.setupCharge)}
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '14px', paddingTop: '12px', borderTop: '1px dashed #334155' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingService(svc);
                          setShowEditServiceModal(true);
                        }}
                        style={{
                          flex: 1,
                          backgroundColor: '#334155',
                          color: '#F8FAFC',
                          border: 'none',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: '700',
                          cursor: 'pointer',
                        }}
                      >
                        ✏️ Edit Item
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteService(svc.id, svc.name)}
                        style={{
                          backgroundColor: 'rgba(239, 68, 68, 0.15)',
                          color: '#EF4444',
                          border: 'none',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: '700',
                          cursor: 'pointer',
                        }}
                      >
                        🗑️ Archive
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PHYSICAL EQUIPMENT TRACKER */}
        {activeTab === 'equipment' && (
          <div>
            {/* Filters */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: '#94A3B8', fontWeight: '600' }}>Filter Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  backgroundColor: '#1E293B',
                  color: '#F8FAFC',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontSize: '14px',
                }}
              >
                <option value="">All Statuses</option>
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="RESERVED">RESERVED</option>
                <option value="DISPATCHED">DISPATCHED</option>
                <option value="IN_USE">IN_USE</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
                <option value="DAMAGED">DAMAGED</option>
              </select>
            </div>

            {loadingEquipment ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
                Loading equipment units...
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: '16px',
                  overflow: 'hidden',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #334155', backgroundColor: '#0F172A' }}>
                      <th style={{ padding: '16px', color: '#94A3B8', fontSize: '13px' }}>Asset Tag</th>
                      <th style={{ padding: '16px', color: '#94A3B8', fontSize: '13px' }}>Linked Service</th>
                      <th style={{ padding: '16px', color: '#94A3B8', fontSize: '13px' }}>Condition</th>
                      <th style={{ padding: '16px', color: '#94A3B8', fontSize: '13px' }}>Status</th>
                      <th style={{ padding: '16px', color: '#94A3B8', fontSize: '13px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {equipment.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #334155' }}>
                        <td style={{ padding: '16px', fontWeight: '700', color: '#F59E0B' }}>
                          {item.assetTag}
                        </td>
                        <td style={{ padding: '16px', color: '#F8FAFC' }}>
                          {item.service?.name || 'N/A'}
                        </td>
                        <td style={{ padding: '16px', color: '#94A3B8' }}>{item.condition}</td>
                        <td style={{ padding: '16px' }}>
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '700',
                              backgroundColor:
                                item.status === 'AVAILABLE'
                                  ? 'rgba(16,185,129,0.15)'
                                  : item.status === 'MAINTENANCE' || item.status === 'DAMAGED'
                                  ? 'rgba(239,68,68,0.15)'
                                  : 'rgba(245,158,11,0.15)',
                              color:
                                item.status === 'AVAILABLE'
                                  ? '#10B981'
                                  : item.status === 'MAINTENANCE' || item.status === 'DAMAGED'
                                  ? '#EF4444'
                                  : '#F59E0B',
                            }}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <select
                            value={item.status}
                            onChange={(e) => handleUpdateAssetStatus(item.id, e.target.value)}
                            style={{
                              backgroundColor: '#0F172A',
                              color: '#F8FAFC',
                              border: '1px solid #334155',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              fontSize: '12px',
                            }}
                          >
                            <option value="AVAILABLE">AVAILABLE</option>
                            <option value="RESERVED">RESERVED</option>
                            <option value="DISPATCHED">DISPATCHED</option>
                            <option value="IN_USE">IN_USE</option>
                            <option value="MAINTENANCE">MAINTENANCE</option>
                            <option value="DAMAGED">DAMAGED</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: BUSINESS SETTINGS ENGINE */}
        {activeTab === 'settings' && (
          <div
            style={{
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '20px',
              padding: '32px',
              maxWidth: '640px',
            }}
          >
            <h2 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 20px 0', color: '#F8FAFC' }}>
              Default Pricing & Business Rules Engine
            </h2>
            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#94A3B8', marginBottom: '6px' }}>
                  Base LED Wall Rate (₹ per sq ft)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={settings.baseLedSqFtRate}
                  onChange={(e) => setSettings({ ...settings, baseLedSqFtRate: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: '#0F172A',
                    color: '#F8FAFC',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    padding: '12px',
                    fontSize: '15px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#94A3B8', marginBottom: '6px' }}>
                  Default Setup Fee (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={settings.defaultSetupFee}
                  onChange={(e) => setSettings({ ...settings, defaultSetupFee: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: '#0F172A',
                    color: '#F8FAFC',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    padding: '12px',
                    fontSize: '15px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#94A3B8', marginBottom: '6px' }}>
                  Default Transport Rate (₹ per km)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={settings.defaultTransportRate}
                  onChange={(e) => setSettings({ ...settings, defaultTransportRate: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: '#0F172A',
                    color: '#F8FAFC',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    padding: '12px',
                    fontSize: '15px',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#94A3B8', marginBottom: '6px' }}>
                    GST Tax Percentage (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={settings.taxPercentage}
                    onChange={(e) => setSettings({ ...settings, taxPercentage: e.target.value })}
                    style={{
                      width: '100%',
                      backgroundColor: '#0F172A',
                      color: '#F8FAFC',
                      border: '1px solid #334155',
                      borderRadius: '10px',
                      padding: '12px',
                      fontSize: '15px',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#94A3B8', marginBottom: '6px' }}>
                    Advance Payment (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={settings.advancePayPercentage}
                    onChange={(e) => setSettings({ ...settings, advancePayPercentage: e.target.value })}
                    style={{
                      width: '100%',
                      backgroundColor: '#0F172A',
                      color: '#F8FAFC',
                      border: '1px solid #334155',
                      borderRadius: '10px',
                      padding: '12px',
                      fontSize: '15px',
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingSettings}
                style={{
                  backgroundColor: '#F59E0B',
                  color: '#0F172A',
                  fontWeight: '700',
                  fontSize: '15px',
                  padding: '14px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  marginTop: '12px',
                }}
              >
                {savingSettings ? 'Saving Settings...' : 'Save Pricing Engine Defaults'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Add Service Modal */}
      {showAddServiceModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
          }}
        >
          <div
            style={{
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '20px',
              padding: '32px',
              width: '90%',
              maxWidth: '500px',
            }}
          >
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginTop: 0, color: '#F8FAFC' }}>
              Add New Service Item
            </h3>
            <form onSubmit={handleCreateService} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input
                type="text"
                placeholder="Service Name (e.g. LED Wall P3.9)"
                required
                value={newService.name}
                onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                style={{
                  backgroundColor: '#0F172A',
                  color: '#F8FAFC',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  padding: '10px 14px',
                }}
              />
              <input
                type="text"
                placeholder="Category (e.g. Display, Audio, Camera)"
                required
                value={newService.category}
                onChange={(e) => setNewService({ ...newService, category: e.target.value })}
                style={{
                  backgroundColor: '#0F172A',
                  color: '#F8FAFC',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  padding: '10px 14px',
                }}
              />
              <select
                value={newService.pricingModel}
                onChange={(e) => setNewService({ ...newService, pricingModel: e.target.value })}
                style={{
                  backgroundColor: '#0F172A',
                  color: '#F8FAFC',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  padding: '10px 14px',
                }}
              >
                <option value="AREA_BASED">AREA_BASED (Per Sq Ft)</option>
                <option value="PER_UNIT">PER_UNIT (Per Unit Count)</option>
                <option value="FIXED">FIXED (Flat Package Rate)</option>
              </select>
              <input
                type="number"
                placeholder="Base Rate (₹)"
                required
                value={newService.baseRate}
                onChange={(e) => setNewService({ ...newService, baseRate: e.target.value })}
                style={{
                  backgroundColor: '#0F172A',
                  color: '#F8FAFC',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  padding: '10px 14px',
                }}
              />
              <input
                type="number"
                placeholder="Setup Charge (₹)"
                required
                value={newService.setupCharge}
                onChange={(e) => setNewService({ ...newService, setupCharge: e.target.value })}
                style={{
                  backgroundColor: '#0F172A',
                  color: '#F8FAFC',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  padding: '10px 14px',
                }}
              />
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddServiceModal(false)}
                  style={{
                    backgroundColor: '#334155',
                    color: '#F8FAFC',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#F59E0B',
                    color: '#0F172A',
                    fontWeight: '700',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Asset Modal */}
      {showAddAssetModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
          }}
        >
          <div
            style={{
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '20px',
              padding: '32px',
              width: '90%',
              maxWidth: '500px',
            }}
          >
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginTop: 0, color: '#F8FAFC' }}>
              Register Physical Equipment Asset
            </h3>
            <form onSubmit={handleCreateAsset} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input
                type="text"
                placeholder="Asset Tag (e.g. LED-CAB-001)"
                required
                value={newAsset.assetTag}
                onChange={(e) => setNewAsset({ ...newAsset, assetTag: e.target.value })}
                style={{
                  backgroundColor: '#0F172A',
                  color: '#F8FAFC',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  padding: '10px 14px',
                }}
              />
              <select
                required
                value={newAsset.serviceId}
                onChange={(e) => setNewAsset({ ...newAsset, serviceId: e.target.value })}
                style={{
                  backgroundColor: '#0F172A',
                  color: '#F8FAFC',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  padding: '10px 14px',
                }}
              >
                <option value="">Select Linked Catalog Service</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.category})
                  </option>
                ))}
              </select>
              <select
                value={newAsset.condition}
                onChange={(e) => setNewAsset({ ...newAsset, condition: e.target.value })}
                style={{
                  backgroundColor: '#0F172A',
                  color: '#F8FAFC',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  padding: '10px 14px',
                }}
              >
                <option value="EXCELLENT">EXCELLENT</option>
                <option value="GOOD">GOOD</option>
                <option value="FAIR">FAIR</option>
                <option value="NEEDS_REPAIR">NEEDS_REPAIR</option>
              </select>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddAssetModal(false)}
                  style={{
                    backgroundColor: '#334155',
                    color: '#F8FAFC',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#F59E0B',
                    color: '#0F172A',
                    fontWeight: '700',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  Register Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {showEditServiceModal && editingService && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
          }}
        >
          <div
            style={{
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '20px',
              padding: '32px',
              width: '90%',
              maxWidth: '500px',
            }}
          >
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginTop: 0, color: '#F8FAFC' }}>
              Edit Service Item: {editingService.name}
            </h3>
            <form onSubmit={handleUpdateService} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#94A3B8', marginBottom: '4px' }}>Service Name</label>
                <input
                  type="text"
                  required
                  value={editingService.name}
                  onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: '#0F172A',
                    color: '#F8FAFC',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '10px 14px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#94A3B8', marginBottom: '4px' }}>Category</label>
                <input
                  type="text"
                  required
                  value={editingService.category}
                  onChange={(e) => setEditingService({ ...editingService, category: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: '#0F172A',
                    color: '#F8FAFC',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '10px 14px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#94A3B8', marginBottom: '4px' }}>Pricing Model</label>
                <select
                  value={editingService.pricingModel}
                  onChange={(e) => setEditingService({ ...editingService, pricingModel: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: '#0F172A',
                    color: '#F8FAFC',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '10px 14px',
                  }}
                >
                  <option value="AREA_BASED">AREA_BASED (Per Sq Ft)</option>
                  <option value="PER_UNIT">PER_UNIT (Per Unit Count)</option>
                  <option value="FIXED">FIXED (Flat Package Rate)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#94A3B8', marginBottom: '4px' }}>Base Rate (₹)</label>
                <input
                  type="number"
                  required
                  value={editingService.baseRate}
                  onChange={(e) => setEditingService({ ...editingService, baseRate: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    backgroundColor: '#0F172A',
                    color: '#F8FAFC',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '10px 14px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#94A3B8', marginBottom: '4px' }}>Setup Charge (₹)</label>
                <input
                  type="number"
                  required
                  value={editingService.setupCharge}
                  onChange={(e) => setEditingService({ ...editingService, setupCharge: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    backgroundColor: '#0F172A',
                    color: '#F8FAFC',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '10px 14px',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditServiceModal(false);
                    setEditingService(null);
                  }}
                  style={{
                    backgroundColor: '#334155',
                    color: '#F8FAFC',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#F59E0B',
                    color: '#0F172A',
                    fontWeight: '700',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
