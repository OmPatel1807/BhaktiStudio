import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/formatters';
import { Step1DateVenue } from '../../components/Customer/OrderWizard/Step1DateVenue';
import { Step2Services } from '../../components/Customer/OrderWizard/Step2Services';
import { Step3Specs } from '../../components/Customer/OrderWizard/Step3Specs';
import { Step4Pricing } from '../../components/Customer/OrderWizard/Step4Pricing';
import { Step5Payment } from '../../components/Customer/OrderWizard/Step5Payment';
import { Step6Review } from '../../components/Customer/OrderWizard/Step6Review';

export const OrderWizard = () => {
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();

  const [step, setStep] = useState(1);
  const [loadingServices, setLoadingServices] = useState(true);
  const [availableServices, setAvailableServices] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Custom Event & Web Speech API State
  const [isCustomEventType, setIsCustomEventType] = useState(false);
  const [customEventInput, setCustomEventInput] = useState('');
  const [isListening, setIsListening] = useState(false);

  // Form State
  const [eventDetails, setEventDetails] = useState({
    eventType: 'Wedding / Reception',
    eventDate: '',
    startTime: '10:00 AM',
    endTime: '10:00 PM',
    venueAddress: '',
    guestCount: 200,
    notes: '',
  });

  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [serviceQuantities, setServiceQuantities] = useState({});
  const [specifications, setSpecifications] = useState({
    ledWidthFeet: 12,
    ledHeightFeet: 8,
    transportDistanceKm: 15,
  });

  const [paymentPreference, setPaymentPreference] = useState('ONLINE');
  const [paymentType, setPaymentType] = useState('ADVANCE');

  // Estimation State
  const [estimation, setEstimation] = useState(null);
  const [calculatingEstimate, setCalculatingEstimate] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState(null);

  // Fetch Services from API
  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const res = await fetch('/api/v1/services');
        const json = await res.json();
        if (json.success) {
          setAvailableServices(json.data || []);
          const editId = new URLSearchParams(window.location.search).get('edit');
          if (!editId) {
            const led = (json.data || []).find((s) => s.name?.includes('LED'));
            if (led) setSelectedServiceIds([led.id]);
          }
        }
      } catch (err) {
        console.error('Failed to load services:', err);
      } finally {
        setLoadingServices(false);
      }
    };
    loadCatalog();
  }, []);

  // Pre-load order if in edit mode
  useEffect(() => {
    const editId = new URLSearchParams(window.location.search).get('edit');
    if (editId) {
      setIsEditing(true);
      setEditingOrderId(editId);
      
      const fetchOrder = async () => {
        try {
          const res = await fetch(`/api/v1/orders/${editId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const json = await res.json();
          if (json.success && json.data) {
            const ord = json.data;
            const fmtDate = ord.eventDate ? ord.eventDate.split('T')[0] : '';
            const fmtEndDate = ord.endDate ? ord.endDate.split('T')[0] : '';

            setEventDetails({
              eventType: ord.eventType,
              eventDate: fmtDate,
              endDate: fmtEndDate,
              isMultiDay: !!ord.endDate,
              totalDays: ord.totalDays || 1,
              startTime: ord.startTime,
              endTime: ord.endTime,
              venueAddress: ord.venueAddress,
              guestCount: ord.guestCount || 200,
              notes: ord.notes || '',
            });

            const isStandard = ['Wedding / Reception', 'Concert / Cultural Fest', 'Corporate Seminar', 'Private Celebration / Party'].includes(ord.eventType);
            if (!isStandard) {
              setIsCustomEventType(true);
              setCustomEventInput(ord.eventType);
            }

            setSpecifications({
              ledWidthFeet: ord.ledWidthFeet || 12,
              ledHeightFeet: ord.ledHeightFeet || 8,
              transportDistanceKm: ord.distanceKm || 15,
            });

            if (availableServices && availableServices.length > 0) {
              const serviceIds = [];
              const quantities = {};
              (ord.orderItems || []).forEach((item) => {
                const match = availableServices.find((s) => s.name === item.serviceName);
                if (match) {
                  serviceIds.push(match.id);
                  quantities[match.id] = item.quantity;
                }
              });
              setSelectedServiceIds(serviceIds);
              setServiceQuantities(quantities);
            }
          }
        } catch (err) {
          console.error("Failed to load order for edit:", err);
        }
      };
      
      if (availableServices && availableServices.length > 0) {
        fetchOrder();
      }
    }
  }, [availableServices, token]);

  // Selected services objects list
  const selectedServicesList = (availableServices || []).filter((s) => selectedServiceIds.includes(s.id));

  // Web Speech API Voice Transcription Handler
  const handleToggleSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser. Please type your custom event manually.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setCustomEventInput(transcript);
        setEventDetails((prev) => ({ ...prev, eventType: transcript }));
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Speech recognition initialization error:', err);
      setIsListening(false);
    }
  };

  // Fetch Live Price Estimate from Backend
  const fetchLiveEstimate = async () => {
    if (selectedServiceIds.length === 0) {
      setEstimation({
        servicesSubtotal: 0,
        setupFeeTotal: 0,
        transportFee: 0,
        taxPercentage: 18,
        taxAmount: 0,
        grandTotal: 0,
      });
      return;
    }

    setCalculatingEstimate(true);
    try {
      const res = await fetch('/api/v1/orders/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedServices: selectedServiceIds.map((id) => ({ serviceId: id, quantity: serviceQuantities[id] || 1 })),
          ledWidthFeet: specifications.ledWidthFeet,
          ledHeightFeet: specifications.ledHeightFeet,
          transportDistanceKm: specifications.transportDistanceKm,
          totalDays: eventDetails.totalDays || 1,
        }),
      });

      const json = await res.json();
      if (json.success) setEstimation(json.data?.financialSummary || null);
    } catch (err) {
      console.error('Estimation calculation error:', err);
    } finally {
      setCalculatingEstimate(false);
    }
  };

  useEffect(() => {
    fetchLiveEstimate();
  }, [selectedServiceIds, serviceQuantities, specifications, eventDetails.totalDays]);

  const toggleServiceSelection = (id) => {
    if (selectedServiceIds.includes(id)) {
      setSelectedServiceIds(selectedServiceIds.filter((item) => item !== id));
    } else {
      setSelectedServiceIds([...selectedServiceIds, id]);
      if (!serviceQuantities[id]) {
        setServiceQuantities((prev) => ({ ...prev, [id]: 1 }));
      }
    }
  };

  const handleUpdateQuantity = (id, qty) => {
    setServiceQuantities((prev) => ({ ...prev, [id]: Math.max(1, qty) }));
  };

  // STEP NAVIGATION GUARD
  const handleNextStep = () => {
    if (step === 2 && selectedServiceIds.length === 0) {
      setErrorMsg('Please select at least one service or equipment to proceed.');
      return;
    }
    setErrorMsg(null);
    setStep(step + 1);
  };

  // DEFENSIVE ORDER SUBMISSION
  const handleSubmitOrder = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (selectedServiceIds.length === 0) {
      setErrorMsg('Please select at least one service before submitting an order.');
      return;
    }

    setErrorMsg(null);
    setSubmitting(true);

    try {
      const selected = (availableServices || []).filter((s) => selectedServiceIds.includes(s.id));
      const finalEventType = isCustomEventType ? customEventInput || 'Custom Event' : eventDetails.eventType;

      const formattedServices = (selected || []).map((s) => {
        const isLed = Boolean(
          s.category === 'DISPLAY' ||
          s.name?.toUpperCase().includes('LED')
        );
        const w = isLed ? Number(specifications.ledWidthFeet || 12) : null;
        const h = isLed ? Number(specifications.ledHeightFeet || 8) : null;
        const area = (w && h) ? (w * h) : 1;
        const unitRate = Number(s.baseRate || s.price || 0);
        const qty = Number(serviceQuantities[s.id] || s.quantity || 1);
        const days = Number(s.days || eventDetails.totalDays || 1);
        const computedPrice = unitRate * area * qty * days;

        return {
          serviceId: s.id,
          name: s.name,
          category: s.category,
          unitRate,
          width: w,
          height: h,
          areaSqFt: isLed ? area : null,
          quantity: qty,
          days,
          price: computedPrice,
        };
      });

      const url = isEditing && editingOrderId ? `/api/v1/orders/${editingOrderId}` : '/api/v1/orders';
      const method = isEditing && editingOrderId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...eventDetails,
          eventType: finalEventType,
          selectedServices: formattedServices,
          ledWidthFeet: specifications.ledWidthFeet,
          ledHeightFeet: specifications.ledHeightFeet,
          transportDistanceKm: specifications.transportDistanceKm,
          paymentPreference,
        }),
      });

      const json = await res.json();
      setSubmitting(false);

      if (res.ok && json.success) {
        navigate('/customer/dashboard');
      } else {
        setErrorMsg(json.message || 'Failed to submit order.');
      }
    } catch (err) {
      setSubmitting(false);
      setErrorMsg('Network error submitting order.');
    }
  };

  const isStep2NextDisabled = step === 2 && selectedServiceIds.length === 0;

  return (
    <div
      style={{
        minHeight: '100dvh',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        padding: 'clamp(16px, 4vw, 32px) clamp(10px, 3vw, 16px)',
        fontFamily: 'Inter, system-ui, sans-serif',
        transition: 'background-color 0.3s ease, color 0.3s ease',
      }}
    >
      <div style={{ maxWidth: '920px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {/* LOOP 71: STEPPER NAVIGATION TABS */}
        <div style={{ marginBottom: '40px' }}>
          {/* MOBILE STEPPER PROGRESS HEADER (< 768px) */}
          <div className="show-mobile-only" style={{ display: 'none', width: '100%', marginBottom: '20px', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: '800', color: '#C97A13', marginBottom: '8px' }}>
              <span>STEP {step} OF 6</span>
              <span>{['Event & Schedule', 'Services & Equipment', 'Specifications', 'Pricing & Quote', 'Payment Preference', 'Review Order'][step - 1]}</span>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-input)', borderRadius: '999px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
              <div
                style={{
                  height: '100%',
                  backgroundColor: '#C97A13',
                  borderRadius: '999px',
                  transition: 'width 0.3s ease',
                  width: `${(step / 6) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* DESKTOP STEPPER PILL TABS (>= 768px) */}
          <div className="hidden-mobile" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {['Event', 'Services', 'Specs', 'Pricing', 'Payment', 'Review'].map((label, idx) => {
                const isCurrent = step === idx + 1;
                const isPassed = step > idx + 1;
                return (
                  <div
                    key={label}
                    onClick={() => {
                      if (idx + 1 > 2 && selectedServiceIds.length === 0) {
                        setErrorMsg('Please select at least one service or equipment to proceed.');
                        return;
                      }
                      setErrorMsg(null);
                      setStep(idx + 1);
                    }}
                    style={{
                      fontSize: '16px',
                      fontWeight: isCurrent ? '800' : '600',
                      color: isCurrent ? '#C97A13' : isPassed ? 'var(--text-primary)' : 'var(--text-secondary)',
                      backgroundColor: isCurrent ? 'rgba(201, 122, 19, 0.15)' : 'transparent',
                      padding: '8px 16px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {idx + 1}. {label}
                  </div>
                );
              })}
            </div>
            <div
              style={{
                height: '6px',
                backgroundColor: 'var(--border-color)',
                borderRadius: '3px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  backgroundColor: '#C97A13',
                  width: `${(step / 6) * 100}%`,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        </div>

        {/* Wizard Card Container */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '28px',
            border: '1px solid var(--border-color)',
            padding: '40px',
            boxShadow: '0 20px 30px -5px rgba(0, 0, 0, 0.08)',
            transition: 'background-color 0.3s ease, border-color 0.3s ease',
          }}
        >
          {errorMsg && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #EF4444',
                color: '#DC2626',
                padding: '16px 20px',
                borderRadius: '14px',
                marginBottom: '28px',
                fontSize: '16px',
                fontWeight: '600',
              }}
            >
              ⚠️ {errorMsg}
            </div>
          )}

          {/* LOOP 31: STEP 1 WITH HYBRID TIMEPICKER */}
          {step === 1 && (
            <Step1DateVenue
              eventDetails={eventDetails}
              setEventDetails={setEventDetails}
              isCustomEventType={isCustomEventType}
              setIsCustomEventType={setIsCustomEventType}
              customEventInput={customEventInput}
              setCustomEventInput={setCustomEventInput}
              isListening={isListening}
              handleToggleSpeechRecognition={handleToggleSpeechRecognition}
            />
          )}

          {/* STEP 2 COMPONENT WITH SELECTION GUARD */}
          {step === 2 && (
            <Step2Services
              loadingServices={loadingServices}
              availableServices={availableServices}
              selectedServiceIds={selectedServiceIds}
              serviceQuantities={serviceQuantities}
              onToggleServiceSelection={toggleServiceSelection}
              onUpdateQuantity={handleUpdateQuantity}
            />
          )}

          {/* STEP 3 COMPONENT WITH CONDITIONAL LED SPECS */}
          {step === 3 && (
            <Step3Specs
              selectedServices={selectedServicesList}
              specifications={specifications}
              setSpecifications={setSpecifications}
            />
          )}

          {/* STEP 4 PRICING BREAKDOWN */}
          {step === 4 && (
            <Step4Pricing
              calculatingEstimate={calculatingEstimate}
              estimation={estimation}
              selectedServices={selectedServicesList}
            />
          )}

          {/* STEP 5: PAYMENT PREFERENCE & METHOD ROUTING */}
          {step === 5 && (
            <Step5Payment
              paymentPreference={paymentPreference}
              setPaymentPreference={setPaymentPreference}
              paymentType={paymentType}
              setPaymentType={setPaymentType}
              estimation={estimation}
            />
          )}

          {/* STEP 6 COMPONENT WITH DEFENSIVE REVIEW & SUBMISSION */}
          {step === 6 && (
            <Step6Review
              eventDetails={eventDetails}
              customEventInput={customEventInput}
              isCustomEventType={isCustomEventType}
              selectedServices={selectedServicesList}
              specifications={specifications}
              estimation={estimation}
              submitting={submitting}
              onSubmitOrder={handleSubmitOrder}
            />
          )}

          {/* Navigation Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px' }}>
            {step > 1 && (
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setStep(step - 1);
                }}
                style={{
                  backgroundColor: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  padding: '14px 28px',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                Back
              </button>
            )}
            {step < 6 && (
              <button
                type="button"
                disabled={isStep2NextDisabled}
                onClick={handleNextStep}
                style={{
                  backgroundColor: isStep2NextDisabled ? '#94A3B8' : '#C97A13',
                  color: '#FFFFFF',
                  fontWeight: '800',
                  fontSize: '16px',
                  border: 'none',
                  padding: '14px 32px',
                  borderRadius: '12px',
                  cursor: isStep2NextDisabled ? 'not-allowed' : 'pointer',
                  marginLeft: 'auto',
                  boxShadow: isStep2NextDisabled ? 'none' : '0 8px 16px rgba(201, 122, 19, 0.25)',
                  opacity: isStep2NextDisabled ? 0.6 : 1,
                }}
              >
                Next Step →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
