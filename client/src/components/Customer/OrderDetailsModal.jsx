import React, { useState } from 'react';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { getAdvancePercentage } from '../../services/pricingService';
import { rehydrateQuotation, computeEquipmentSubtotal } from '../../utils/quotationMath';

export const OrderDetailsModal = ({ order, isOpen, onClose, onOpenPaymentModal, onMarkCompleted }) => {
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'proof'
  const [zoomedImage, setZoomedImage] = useState(null);

  if (!isOpen || !order) return null;

  const rawQuotation = order.quotations?.[0];

  // LOOP 40: Unified rehydration — single source of truth
  const latestQuotation = rehydrateQuotation(rawQuotation, order.orderItems);
  const equipmentTotal = computeEquipmentSubtotal(order.orderItems);

  const beforePhotos = (order.executionMedia || []).filter(m => m.mediaType === 'BEFORE_SETUP');
  const afterPhotos = (order.executionMedia || []).filter(m => m.mediaType === 'AFTER_SETUP');
  const totalPhotosCount = beforePhotos.length + afterPhotos.length;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '24px',
          border: '1px solid var(--border-color)',
          padding: '32px',
          maxWidth: '680px',
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
          color: 'var(--text-primary)',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
          transition: 'background-color 0.3s ease, color 0.3s ease',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#C97A13', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Order Lifecycle Breakdown
            </span>
            <h2 style={{ fontSize: '24px', fontWeight: '800', margin: '4px 0 0 0', color: 'var(--text-primary)' }}>
              Order #{order.orderNumber}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ backgroundColor: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '22px', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* Status Badges Row */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <span
            style={{
              backgroundColor: 'rgba(201, 122, 19, 0.15)',
              color: '#C97A13',
              padding: '6px 12px',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '12px',
            }}
          >
            Status: {order.status}
          </span>
          <span
            style={{
              backgroundColor: order.paymentStatus === 'PAID' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
              color: order.paymentStatus === 'PAID' ? '#10B981' : '#EF4444',
              padding: '6px 12px',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '12px',
            }}
          >
            Payment: {order.paymentStatus}
          </span>
        </div>

        {/* Tab Buttons */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '20px', paddingBottom: '2px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'details' ? '2px solid #C97A13' : '2px solid transparent',
              color: activeTab === 'details' ? '#C97A13' : 'var(--text-secondary)',
              fontWeight: '750',
              fontSize: '14px',
              padding: '8px 16px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            📋 Order Breakdown
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('proof')}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'proof' ? '2px solid #C97A13' : '2px solid transparent',
              color: activeTab === 'proof' ? '#C97A13' : 'var(--text-secondary)',
              fontWeight: '750',
              fontSize: '14px',
              padding: '8px 16px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            📸 Proof of Work
            {totalPhotosCount > 0 && (
              <span style={{ backgroundColor: '#C97A13', color: '#FFFFFF', fontSize: '11px', padding: '2px 6px', borderRadius: '10px', fontWeight: '800' }}>
                {totalPhotosCount}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'details' ? (
          <>
            {/* Event Info Card */}
            <div style={{ backgroundColor: 'var(--bg-input)', padding: '16px', borderRadius: '14px', marginBottom: '20px', fontSize: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                <div>
                  🗓️ <strong>Event Type:</strong> <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>{order.eventType}</span>
                </div>
                {(Number(order.durationDays || order.totalDays || 1) > 1) ? (
                  <span style={{ backgroundColor: 'rgba(201, 122, 19, 0.2)', color: '#C97A13', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '800' }}>
                    ⚡ Multi-Day Event: {order.durationDays || order.totalDays} Days
                  </span>
                ) : (
                  <span style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '700' }}>
                    📅 Single-Day Event
                  </span>
                )}
              </div>

              <div style={{ marginTop: '6px' }}>
                🗓️ <strong>Event Span / Date:</strong> {(Number(order.durationDays || order.totalDays || 1) > 1 && order.endDate) ? (
                  <span>{formatDateTime(order.startDate || order.eventDate)} <strong>to</strong> {formatDateTime(order.endDate)} ({order.durationDays || order.totalDays} Days)</span>
                ) : (
                  <span>{formatDateTime(order.eventDate || order.startDate)}</span>
                )}
              </div>
              <div style={{ marginTop: '6px' }}>⏰ <strong>Timings:</strong> {order.startTime} - {order.endTime}</div>
              <div style={{ marginTop: '6px' }}>📍 <strong>Venue Address:</strong> {order.venueAddress}</div>
              {order.distanceKm && (
                <div style={{ marginTop: '6px', color: '#C97A13', fontWeight: '600' }}>
                  🚗 <strong>Event Distance:</strong> {order.distanceKm} km {order.requiresCustomTransport && '(Outstation Surcharge Range)'}
                </div>
              )}
            </div>

            {/* Selected Services Breakdown */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#C97A13', margin: '0 0 10px 0' }}>
                Selected Services & Equipment
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {order.orderItems?.map((item, idx) => {
                  const rate = Number(item.finalRate || item.estimatedRate || 0);
                  const qty = Number(item.quantity || 1);
                  const days = Number(item.days || order.durationDays || order.totalDays || 1);
                  const isSqFt = Boolean(item.widthFt && item.heightFt);
                  const area = isSqFt ? Number(item.widthFt) * Number(item.heightFt) : 0;
                  const itemTotal = isSqFt
                    ? (rate > 500 && area > 1 ? rate : rate * area) * days * qty
                    : rate * qty * days;

                  return (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: 'var(--bg-input)',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '14px',
                      }}
                    >
                      <div>
                        <div>
                          <strong style={{ color: 'var(--text-primary)' }}>{item.serviceName}</strong>
                          {isSqFt && ` (${item.widthFt} × ${item.heightFt} ft)`}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {isSqFt ? (
                            `${area} sq ft @ ${formatCurrency(rate)}/sqft × ${days} ${days > 1 ? 'Days' : 'Day'}`
                          ) : (
                            `${qty} ${qty > 1 ? 'Units' : 'Unit'} × ${formatCurrency(rate)}/day × ${days} ${days > 1 ? 'Days' : 'Day'}`
                          )}
                        </div>
                      </div>
                      <span style={{ fontWeight: '800', color: '#C97A13', fontSize: '15px' }}>
                        {formatCurrency(itemTotal)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quotation Summary */}
            {latestQuotation && (
              <div style={{ backgroundColor: 'var(--bg-input)', padding: '18px', borderRadius: '14px', marginBottom: '24px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 12px 0' }}>
                  Financial Quotation Breakdown (V{latestQuotation.versionNumber})
                </h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Equipment & Services Subtotal:</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>{formatCurrency(equipmentTotal)}</span>
                </div>
                {Number(latestQuotation.setupFee || 0) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Setup & Rigging Charges:</span>
                    <span style={{ color: 'var(--text-primary)' }}>+{formatCurrency(latestQuotation.setupFee)}</span>
                  </div>
                )}
                {Number(latestQuotation.transportFee || 0) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Transport & Logistics:</span>
                    <span style={{ color: 'var(--text-primary)' }}>+{formatCurrency(latestQuotation.transportFee)}</span>
                  </div>
                )}
                {Number(latestQuotation.technicianFee || 0) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>On-Site Technician Support:</span>
                    <span style={{ color: 'var(--text-primary)' }}>+{formatCurrency(latestQuotation.technicianFee)}</span>
                  </div>
                )}
                {Number(latestQuotation.discounts || 0) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px', color: '#10B981' }}>
                    <span>Discount Applied:</span>
                    <span>-{formatCurrency(latestQuotation.discounts)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>GST (18%):</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{formatCurrency(latestQuotation.taxAmount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', marginBottom: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '800' }}>Grand Total:</span>
                  <span style={{ fontWeight: '800', color: '#C97A13' }}>{formatCurrency(latestQuotation.totalAmount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <span>{getAdvancePercentage()}% Mandatory Advance Required:</span>
                  <span style={{ fontWeight: '700', color: '#C97A13' }}>{formatCurrency(latestQuotation.advanceFee)}</span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ marginBottom: '24px' }}>
            {totalPhotosCount === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>📸</div>
                <div style={{ fontWeight: '750', fontSize: '16px', color: 'var(--text-primary)' }}>No Execution Photos Uploaded Yet</div>
                <div style={{ fontSize: '13px', marginTop: '4px' }}>Once workers upload site photos, they will appear here.</div>
              </div>
            ) : (
              <div>
                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10B981', padding: '8px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', marginBottom: '20px', display: 'inline-block' }}>
                  Setup Verified ({beforePhotos.length} Before, {afterPhotos.length} After Photos Uploaded)
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  {/* Before Setup Column */}
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#F59E0B', textTransform: 'uppercase', marginBottom: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                      ⏮️ Before Setup ({beforePhotos.length})
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {beforePhotos.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', border: '1px dashed var(--border-color)', borderRadius: '10px', fontSize: '12px' }}>
                          No before photos uploaded.
                        </div>
                      ) : (
                        beforePhotos.map((photo) => (
                          <div
                            key={photo.id}
                            onClick={() => setZoomedImage(photo.imageUrl)}
                            style={{
                              backgroundColor: 'var(--bg-input)',
                              borderRadius: '12px',
                              border: '1px solid var(--border-color)',
                              overflow: 'hidden',
                              cursor: 'zoom-in',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <img src={photo.imageUrl} alt="Before Setup" style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                            <div style={{ padding: '8px 12px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                              <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>👤 {photo.worker?.name || 'Worker'}</div>
                              <div style={{ marginTop: '2px' }}>🕒 {formatDateTime(photo.createdAt)}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* After Setup Column */}
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#10B981', textTransform: 'uppercase', marginBottom: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                      ⏭️ After Setup ({afterPhotos.length})
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {afterPhotos.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', border: '1px dashed var(--border-color)', borderRadius: '10px', fontSize: '12px' }}>
                          No after photos uploaded.
                        </div>
                      ) : (
                        afterPhotos.map((photo) => (
                          <div
                            key={photo.id}
                            onClick={() => setZoomedImage(photo.imageUrl)}
                            style={{
                              backgroundColor: 'var(--bg-input)',
                              borderRadius: '12px',
                              border: '1px solid var(--border-color)',
                              overflow: 'hidden',
                              cursor: 'zoom-in',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <img src={photo.imageUrl} alt="After Setup" style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                            <div style={{ padding: '8px 12px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                              <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>👤 {photo.worker?.name || 'Worker'}</div>
                              <div style={{ marginTop: '2px' }}>🕒 {formatDateTime(photo.createdAt)}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end w-full mt-4">
          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              padding: '12px 20px',
              borderRadius: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              textAlign: 'center',
            }}
          >
            Close
          </button>
          {onMarkCompleted && !['COMPLETED', 'CLOSED', 'CANCELLED'].includes(order.status) && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onMarkCompleted(order);
              }}
              style={{
                backgroundColor: '#10B981',
                color: '#FFFFFF',
                fontWeight: '900',
                padding: '12px 22px',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                whiteSpace: 'nowrap',
                textAlign: 'center',
              }}
            >
              ✅ Mark Event Completed
            </button>
          )}
          {order.paymentStatus !== 'PAID' && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenPaymentModal?.(order, latestQuotation);
              }}
              style={{
                backgroundColor: '#F59E0B',
                color: '#0F172A',
                fontWeight: '900',
                padding: '12px 22px',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
                whiteSpace: 'nowrap',
                textAlign: 'center',
              }}
            >
              💳 Pay Online Now
            </button>
          )}
        </div>
      </div>

      {/* Zoom Modal Overlay */}
      {zoomedImage && (
        <div
          onClick={() => setZoomedImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            cursor: 'zoom-out',
          }}
        >
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
            <img src={zoomedImage} alt="Zoomed View" style={{ width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '90vh', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} />
            <button
              onClick={() => setZoomedImage(null)}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                backgroundColor: 'transparent',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '30px',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
