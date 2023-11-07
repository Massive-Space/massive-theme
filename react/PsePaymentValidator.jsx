import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Spinner, Modal, Link } from 'vtex.styleguide';
const useDisclosure = require('./useDisclosure').default
import styles from './PsePaymentValidator.css';

const spinnerContainerStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
  height: '100vh',
  alignItems: 'center',
  backgroundColor: '#f0feff',
  zIndex: 20000
};

const API_BASE_URL = 'https://dev.paymentsya.com/api';

const PsePaymentValidator = () => {
  const selectRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [banks, setBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState({});
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [fromTheStore, setFromTheStore] = useState(true);

  const bankCode = useMemo(() => selectedBank?.bank_code, [selectedBank]);

  const modalTitle = useMemo(() => fromTheStore ? 'Selecciona tu banco para continuar' : 'Selecciona de nuevo tu banco para continuar', [fromTheStore])

  const fetchApi = async (url, body, method = 'POST') => {
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("account", globalThis.__RUNTIME__.account);

    const requestOptions = {
      method,
      headers,
      redirect: 'follow'
    };

    if (!!body) {
      requestOptions.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${url}`, requestOptions);
    return await response.json();
  };

  const fetchBanks = async () => {
    const result = await fetchApi('/banks', null, 'GET');
    setBanks(result.data || []);
  };

  const handleRetryPayment = async () => {
    onOpen();
    await fetchBanks();
  };

  const addRetryPaymentButton = () => {
    const orderOptionsWrapper = document.querySelector('div[class*="orderOptionsWrapper"]');

    if (orderOptionsWrapper && !orderOptionsWrapper.querySelector('.retry-payment-btn')) {
      const button = document.createElement('button');
      button.innerText = 'Reintentar Pago';
      button.classList.add('retry-payment-btn');

      Object.assign(button.style, {
        height: '39px',
        backgroundColor: '#134cd8',
        border: '1px solid #134cd8',
        color: '#fff',
        fontFamily: 'Fabriga, -apple-system, BlinkMacSystemFont, "avenir next", avenir, "helvetica neue", helvetica, ubuntu, roboto, noto, "segoe ui", arial, sans-serif',
        fontWeight: '500',
        fontSize: '1rem',
        textTransform: 'uppercase',
        letterSpacing: '0',
        paddingLeft: '1.5rem',
        paddingRight: '1.5rem',
        borderWidth: '0.125rem',
        borderRadius: '0.25rem',
        borderStyle: 'solid',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'background-color 0.3s ease'
      });

      button.onmouseover = function() {
        button.style.backgroundColor = '#0C389F';
      };

      button.onmouseout = function() {
        button.style.backgroundColor = '#134cd8';
      };

      button.addEventListener('click', handleRetryPayment);

      orderOptionsWrapper.appendChild(button);
    }
  };

  const validateOrderStatus = async () => {
    const urlParams = new URLSearchParams(globalThis.location.search);
    const ogParam = urlParams.get('og');
    const body = { "order_group": ogParam };
    const result = await fetchApi('/order-info', body);
    if (result.data.needs_to_process) {
      await recoverSelectedBank();
      onOpen();
      await fetchBanks();
    }
    addRetryPaymentButton();
  };

  const handlePayment = async () => {
    console.log(selectedBank);
    if (!selectedBank.order || !selectedBank.bank_code || !selectedBank.bank_name) {
      return;
    }
    setIsLoading(true);
    try {
      const result = await fetchApi('/payment-url', selectedBank);
      if (result.status === 200 && result.data && result.data.url_payment) {
        window.location.href = result.data.url_payment;
      } else {
        throw new Error('Error al obtener la URL de pago');
      }
    } catch (error) {
      setIsLoading(false);
    }
  };

  const recoverSelectedBank = async () => {
    const storedBank = localStorage.getItem('bank');
    if (storedBank) {
      const parsedBank = JSON.parse(storedBank);
      if (parsedBank.name && parsedBank.code) {
        handleBankChange(parsedBank.code, parsedBank.name);
      }
    }
  };

  useEffect(() => {
    const storedBank = localStorage.getItem('bank');
    if (!!storedBank && !!selectedBank.bank_name && !!selectedBank.bank_code && !!selectedBank.order) {
      localStorage.removeItem('bank');
      handlePayment();
    }
  }, [selectedBank]);

  useEffect(() => {
    const init = async () => {
      await validateOrderStatus()
        .then(() => null)
        .finally(() => setIsLoading(false));
    };
    init();
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (typeof window !== 'undefined' || typeof globalThis !== 'undefined') {
        clearInterval(intervalId);

        const styleContent = `
          header[class*="orderPlacedHeader"] {
            display: none;
          }
          .vtex-modal__overlay {
            background-color: #EFF4FF !important;
          }
          .vtex-modal__modal {
            border-radius: 2.1875rem;
          }
		  div[class*="cancelOrderButton"] {
			display: none;
		  }
        `;

        const style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = styleContent;

        document.getElementsByTagName('head')[0].appendChild(style);

        const referrer = document.referrer;
        const referrerDomain = new URL(referrer).hostname;
        const currentDomain = window.location.hostname;

        setFromTheStore(referrerDomain === currentDomain);
      }
    }, 10);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleBankChange = (bankCode, bankName) => {
    setDropdownOpen(false);
    if (bankCode === null) {
      setSelectedBank({});
      return;
    }
    const urlParams = new URLSearchParams(globalThis.location.search);
    const ogParam = urlParams.get('og');
    setSelectedBank({
      order: ogParam + "-01",
      bank_code: bankCode,
      bank_name: bankName
    });
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selectRef]);

  return (
    <>
      {isLoading ? (
        <div style={spinnerContainerStyle}>
          <Spinner size={60} />
        </div>
      ) : null}

      <Modal
        isOpen={isOpen}
        closeOnOverlayClick={false}
        showCloseIcon={false}
        className={styles['modal-container']}
        onClose={() => null}
      >
        <div className={`w-100 ${styles['logo-container']}`}>
          <img src="/arquivos/mobile-payment.svg" alt="payments-ya" />
        </div>
        <div className={styles['title-container']}>
          <h1>{modalTitle}</h1>
        </div>
        <div className={styles['explanation-container']}>
          <p>Elige el banco con el que deseas realizar tu transferencia, serás redirigido al mismo para continuar con tu compra.</p>
        </div>
        <div className={styles['body-container']}>
          <div className={`flex flex-column flex-row-ns ${styles['select-container']}`}>
            <div className={styles['bank-select']}>

              <div ref={selectRef} className={styles['custom-select']} onClick={() => toggleDropdown()}>
                <div className={styles['selected-option']}>
                  {!!Object.keys(selectedBank).length
                    ? selectedBank.bank_name
                    : <span className={styles['placeholder']}>Selecciona tu banco</span>
                  }
                </div>
                <div className={`${styles['options']} ${dropdownOpen ? styles['open'] : ''}`}>
                  <div className={styles['option']} onClick={() => handleBankChange(null, null)}>
                    Selecciona tu banco
                  </div>
                  {banks.map(bank => (
                    <div key={bank.id} className={`${styles['option']} ${bank.codigoach === bankCode ? styles['bank-selected'] : ''}`} onClick={() => handleBankChange(bank.codigoach, bank.nombre)}>
                      {bank.nombre}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
          <div className={styles['actions-container']}>
            <Link href="/checkout/#/cart" className="no-underline">
              <span className={styles['back-to-commerce-link']}>
                Regresar al comercio
              </span>
            </Link>
            <div
              onClick={handlePayment}
              className={`${styles['continue-button']} ${!Object.keys(selectedBank).length ? styles['button-disabled'] : styles['button-enabled']}`}
            >
              <span className={styles['label']}>
                Continuar
              </span>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default PsePaymentValidator;
