import React, { useCallback } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../index.css';
import Navbar from '../components/Navbar';
import { useEffect, useState } from 'react';
import api from '../api/api';
import ReviewPassengerFeedbackScreen from '../components/ReviewPassengerFeedbackScreen';
import Loader from '../Loader';
import { CButton, CModal, CModalBody, CModalFooter } from '@coreui/react';
import ErrorModal from '../components/ErrorModal';
const Pdf_Screen = () => {
  const [displaySidebar, setDisplaySidebar] = useState(true);
  const [visibleModal, setVisibleModal] = useState(false);
  const [selectStation, setSelectStation] = useState();
  const [url, setUrl] = useState('');
  const [scoreNow, setScoreNow] = useState(false);
  const [onComplain, setonComplain] = useState();
  const [showLoader, setShowLoader] = useState(false);
  const [userType, setUserType] = useState();
  const [stationCategory, setStationCategory] = useState();
  const [error, seterror] = useState('');
  const [date, setDate] = useState('');
  const [warning, setWarning] = useState('null');
  const [previewData, setPreviewData] = useState(false);
  const [htmlData, SetHtmlData] = useState('');
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showOutOfServiceModal, setShowOutOfServiceModal] = useState(false);
  const [showIssueInPDFDownload, setShowIssueInPDFDownloadModal] =
    useState(false);
  const [useMailModal, setUseMailModal] = useState(false);
  const [loadingStates1, setLoadingStates1] = useState({
    mailDailyDIVSummary: false,
    dailyBuyersSheetDownload: false,
    dailySummaryDownload: false,
    dailyReportDownload: false,
    monthlySummaryDownload: false,
    monthlysummaryimages: false,
    dailySummaryImgMail: false,
    monthlySummaryMail: false,
    monthlyDetailsImgMail: false,
    mailDailyBuyerRating: false,
    mailDailySummary: false,
    mailDailyReport: false,
    downloaddailycomplain: false,
    maildailycomplain: false,
    downloadmonthlycomplain: false,
    mailmonthlycomplain: false,
    downloadconsolidatedpdf: false,
    mailconsolidatedpdf: false,
    monthlySumarryDownloadBDE: false,
    mailmonthlysummaryBDE:false,
  });

  const [loadingStates2, setLoadingStates2] = useState({
    dailyBuyersSheetReview: false,
    dailySummaryReview: false,
    dailyReportReview: false,
    dailySummaryImgReview: false,
    monthlySummaryReview: false,
    monthlyDetailsReview: false,
    monthlyDetailsImgReview: false,
    reviewdailycomplain: false,
    reviewmonthlycomplain: false,
    reviewconsolidatedpdf: false,
  });

  const [errorModalFlag, setErrorModalFlag] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const userData1 = JSON.parse(localStorage.getItem('userData'));
  let station = (userData1 && userData1.station_name) || 'station';
  function blobToBase64(blob) {
    return new Promise((resolve, _) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.readAsDataURL(blob);
    });
  }
  const dateConverter = (date) => {
    if (date === undefined) return '';
    const parsedDate = new Date(date);
    const formattedDate = parsedDate.toLocaleString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const [month, day, year] = formattedDate.split('/');
    return `${day}/${month}/${year}`;
  };
  const toggleSideBar = () => {
    setDisplaySidebar(!displaySidebar);
  };
  const showWarning = (message, color, duration) => {
    setWarning({ content: message, color: color });

    setTimeout(() => {
      setWarning(null);
    }, duration || 10000);
  };
  const fetchInfo = useCallback(async () => {
    setShowLoader(true);

    api
      .get(`/pdf/whichpdf`, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        setShowLoader(false);
        if (response.status === 200) {
          // showWarning(response.data.warning_message, 'blue', 50000);
        }
      })
      .catch((error) => {
        setErrorModalFlag(true);
        setErrorMsg(error.message);
        // navigate('/Home');
      });
  }, []);

  const checkDate = (date) => {
    const currentDate = new Date();
    const selectedDate = new Date(date);

    if (selectedDate > currentDate) {
      setShowConfirmationModal(true);
      seterror('date may not be greater than current date');
      setTimeout(() => {
        setShowConfirmationModal(false);
        const currentDateString = currentDate.toISOString().split('T')[0];
        setDate(currentDateString);
      }, 3000);
      return;
    } else {
      setDate(date);
    }
  };

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('userData'));
    const stationCategory = userData && userData.station_category;
    setStationCategory(stationCategory);
    // console.log('Station----Category:', stationCategory);
    const userType = localStorage.getItem('userType');
    setUserType(userType);
    fetchInfo();
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    setDate(formattedDate);
    const handleResize = () => {
      if (window.innerWidth < 991) {
        setDisplaySidebar(false);
      } else {
        setDisplaySidebar(true);
      }
    };

    handleResize();

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [fetchInfo]);

  const DailyBuyersSheetDownload = async (e) => {
    setShowLoader(true);
    e.preventDefault();
    try {
      setLoadingStates1((prevStates) => ({
        ...prevStates,
        dailyBuyersSheetDownload: true,
      }));

      const response = await api.get('/pdf/daily-buyers-sheet/', {
        params: { date: date, download: 'YES' },
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
        responseType: 'blob',
      });
      setShowLoader(false);
      setShowLoader(false);
      setLoadingStates1((prevStates) => ({
        ...prevStates,
        dailyBuyersSheetDownload: false,
      }));
      const contentLength = response.headers.get('Content-Length');
      console.log('The PDF just downloaded have:', contentLength);
      if (!contentLength || Number(contentLength) < 1024) {
        console.error(
          'The PDF file is empty or corrupted or its size is less than 1KB.'
        );
        setShowIssueInPDFDownloadModal(true);
        return;
      } else {
        showWarning(
          ' Download Daily Buyers Rating Sheet pdf downloaded successfully!!',
          'green',
          50000
        );

        const blob = new Blob([response.data], { type: 'application/pdf' });
        // eslint-disable-next-line no-undef
        if (typeof AndroidInterface === 'undefined') {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${station}_daily_buyers_rating_sheet_${dateConverter(
            date
          )}.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);
        } else {
          blobToBase64(blob).then((base64) => {
            // eslint-disable-next-line no-undef
            AndroidInterface.base64toFile(
              base64,
              `${station}_daily_buyers_rating_sheet_${dateConverter(date)}.pdf`,
              'pdf'
            );
          });
        }
      }
    } catch (error) {
      setShowLoader(false);
      console.log(error);
    } finally {
      setShowLoader(false);
      setLoadingStates1((prevStates) => ({
        ...prevStates,
        dailyBuyersSheetDownload: false,
      }));
    }
  }; //✅
  // add mail Daily Buyer rating button
  const mailDailyBuyerRating = async (e) => {
    setShowLoader(true);
    e.preventDefault();
    setLoadingStates1((prevStates) => ({
      ...prevStates,
      mailDailyBuyerRating: true,
    }));
    try {
      const response = await api.get('/pdf/daily-buyers-sheet/', {
        params: { date: date, pdf_method: 'MAIL' },
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      });
      setLoadingStates1((prevStates) => ({
        ...prevStates,
        mailDailyBuyerRating: false,
      }));
      showWarning(
        `Mail  Buyer's Sheet  ${response.data.message}`,
        'green',
        50000
      );
    } catch (error) {
      console.log(error);
      setShowLoader(false);
    } finally {
      setShowLoader(false);
      setLoadingStates1((prevStates) => ({
        ...prevStates,
        mailDailyBuyerRating: false,
      }));
    }
  }; //✅
  const DailyBuyersSheetReview = async (e) => {
    setShowLoader(true);
    e.preventDefault();
    try {
      setLoadingStates2((prevStates) => ({
        ...prevStates,
        dailyBuyersSheetReview: true,
      }));
      const response = await api.get('/pdf/daily-buyers-sheet/', {
        params: { date: date },
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url);
      setLoadingStates2((prevStates) => ({
        ...prevStates,
        dailyBuyersSheetReview: false,
      }));
      setShowLoader(false);
      showWarning(`Daily Buyer's Sheet is open at ==> ${url}`, 'green', 50000);
    } catch (error) {
      setShowLoader(false);
      console.error(error);
      setLoadingStates2((prevStates) => ({
        ...prevStates,
        dailyBuyersSheetReview: false,
      }));
    }
  }; //✅
  // add mail daily Summary button
  const mailDailySummary = async (e) => {
    setShowLoader(true);
    e.preventDefault();
    try {
      setLoadingStates1((prevStates) => ({
        ...prevStates,
        mailDailySummary: true,
      }));
      const response = await api.get('/pdf/daily/', {
        params: { date: date, pdf_method: 'MAIL', pdf_for: 'daily_summary' },
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      });
      setLoadingStates1((prevStates) => ({
        ...prevStates,
        mailDailySummary: false,
      }));
      showWarning(
        `mail daily Summary Sheet : ${response.data.message}`,
        'green',
        50000
      );
      setShowLoader(false);
    } catch (error) {
      setShowLoader(false);
      console.error(error);
      setLoadingStates1((prevStates) => ({
        ...prevStates,
        mailDailySummary: false,
      }));
    }
  }; //✅
  // add mail daily report
  const mailDailyReport = async (e) => {
    setShowLoader(true);
    e.preventDefault();
    try {
      setLoadingStates1((prevStates) => ({
        ...prevStates,
        mailDailyReport: true,
      }));
      const response = await api.get('/pdf/daily/', {
        params: { date: date, pdf_method: 'MAIL', pdf_for: 'daily_report' },
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      });
      setShowLoader(false);
      setLoadingStates1((prevStates) => ({
        ...prevStates,
        mailDailyReport: false,
      }));
      showWarning(
        ` mail Daily Report : ${response.data.message}`,
        'green',
        50000
      );
    } catch (error) {
      setShowLoader(false);
      console.log(error);
      setLoadingStates1((prevStates) => ({
        ...prevStates,
        mailDailyReport: false,
      }));
    }
  }; //✅
  const dailySummaryDownload = async (e) => {
    setShowLoader(true);
    e.preventDefault();
    try {
      setLoadingStates1((prevStates) => ({
        ...prevStates,
        dailySummaryDownload: true,
      }));
      const response = await api.get('/pdf/daily/', {
        params: { date: date, pdf_for: 'daily_summary', download: 'YES' },
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      });
      setShowLoader(false);
      setLoadingStates1((prevStates) => ({
        ...prevStates,
        dailySummaryDownload: false,
      }));
      const contentLength = response.headers.get('Content-Length');
      console.log('The PDF just downloaded have:', contentLength);
      if (!contentLength || Number(contentLength) < 1024) {
        console.error(
          'The PDF file is empty or corrupted or its size is less than 1KB.'
        );
        setShowIssueInPDFDownloadModal(true);
        return;
      } else {
        showWarning(
          ' Daily Summary is Downloaded successfully!!',
          'green',
          50000
        );
        const blob = new Blob([response.data], { type: 'application/pdf' });
        // eslint-disable-next-line no-undef
        if (typeof AndroidInterface === 'undefined') {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${station}_daily_summary_${dateConverter(date)}.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);
        } else {
          blobToBase64(blob).then((base64) => {
            // eslint-disable-next-line no-undef
            AndroidInterface.base64toFile(
              base64,
              `${station}_daily_summary_${dateConverter(date)}.pdf`,
              'pdf'
            );
          });
        }
      }
    } catch (error) {
      setShowLoader(false);
      console.log(error);
      setLoadingStates1((prevStates) => ({
        ...prevStates,
        dailySummaryDownload: false,
      }));
    }
  }; //✅
  const dailySummaryDownloadBDE = async (e) => {
    setShowLoader(true);
    e.preventDefault();
    try {
      setLoadingStates1((prevStates) => ({
        ...prevStates,
        dailySummaryDownloadBDE: true,
      }));
      const response = await api.get('', {
        params: { date: date, pdf_for: 'daily_summary', download: 'YES' },
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      });
      setShowLoader(false);
      setLoadingStates1((prevStates) => ({
        ...prevStates,
        dailySummaryDownloadBDE: false,
      }));
      const contentLength = response.headers.get('Content-Length');
      console.log('The PDF just downloaded have:', contentLength);
      if (!contentLength || Number(contentLength) < 1024) {
        console.error(
          'The PDF file is empty or corrupted or its size is less than 1KB.'
        );
        setShowIssueInPDFDownloadModal(true);
        return;
      } else {
        showWarning(
          ' Daily Summary for BDE stattions is Downloaded successfully!!',
          'green',
          50000
        );
        const blob = new Blob([response.data], { type: 'application/pdf' });
        // eslint-disable-next-line no-undef
        if (typeof AndroidInterface === 'undefined') {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${station}_daily_summary_${dateConverter(date)}.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);
        } else {
          blobToBase64(blob).then((base64) => {
            // eslint-disable-next-line no-undef
            AndroidInterface.base64toFile(
              base64,
              `${station}_daily_summary_${dateConverter(date)}.pdf`,
              'pdf'
            );
          });
        }
      }
    } catch (error) {
      setShowLoader(false);
      console.log(error);
      setLoadingStates1((prevStates) => ({
        ...prevStates,
        dailySummaryDownloadBDE: false,
      }));
    }
  }; //✅

  const mailmonthlysummaryBDE = async (e) => {
    setShowLoader(true);
    e.preventDefault();
    try {
      setLoadingStates1((prevStates) => ({
        ...prevStates,
        mailmonthlysummaryBDE: true,
      }));
      const response = await api.get('/pdf/monthly/mail-summary-bde/', {
        params: { date: date, pdf_method: 'MAIL', pdf_for: 'daily_report' },
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      });
      setShowLoader(false);
      setLoadingStates1((prevStates) => ({
        ...prevStates,
        mailmonthlysummaryBDE: false,
      }));
      showWarning(
        ` mail Daily Report : ${response.data.message}`,
        'green',
        50000
      );
    } catch (error) {
      setShowLoader(false);
      console.log(error);
      setLoadingStates1((prevStates) => ({
        ...prevStates,
        mailmonthlysummaryBDE: false,
      }));
    }
  }; //✅
  const dailySummaryReview = async (e) => {
    setShowLoader(true);
    e.preventDefault();
    try {
      setLoadingStates2((prevStates) => ({
        ...prevStates,
        dailySummaryReview: true,
      }));
      const response = await api.get('/pdf/daily/', {
        params: { date: date, pdf_for: 'daily_summary' },
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url);
      setLoadingStates2((prevStates) => ({
        ...prevStates,
        dailySummaryReview: false,
      }));
      setShowLoader(false);
      showWarning(`Daily summary is open at ==> ${url}`, 'green', 50000);
    } catch (error) {
      setShowLoader(false);
      console.error(error);
      setLoadingStates2((prevStates) => ({
        ...prevStates,
        dailySummaryReview: false,
      }));
    }
  }; //✅

  const DailyReportDownload = async (e) => {
    setShowLoader(true);
    e.preventDefault();
    try {
      setLoadingStates1((prevStates) => ({
        ...prevStates,
        dailyReportDownload: true,
      }));
      const response = await api.get('/pdf/daily/', {
        params: { date: date, pdf_for: 'daily_report', download: 'YES' },
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      });
      setShowLoader(false);
      setLoadingStates1((prevStates) => ({
        ...prevStates,
        dailyReportDownload: false,
      }));
      const contentLength = response.headers.get('Content-Length');
      console.log('The PDF just downloaded have:', contentLength);
      if (!contentLength || Number(contentLength) < 1024) {
        console.error(
          'The PDF file is empty or corrupted or its size is less than 1KB.'
        );
        setShowIssueInPDFDownloadModal(true);
        return;
      } else {
        showWarning(
          ' Daily Report is Downloaded successfully!!',
          'green',
          50000
        );
        const blob = new Blob([response.data], { type: 'application/pdf' });
        // eslint-disable-next-line no-undef
        if (typeof AndroidInterface === 'undefined') {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${station}_daily_report_${dateConverter(date)}.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);
        } else {
          blobToBase64(blob).then((base64) => {
            // eslint-disable-next-line no-undef
            AndroidInterface.base64toFile(
              base64,
              `${station}_daily_report_${dateConverter(date)}.pdf`,
              'pdf'
            );
          });
        }
      }
    } catch (error) {
      setShowLoader(false);
      console.log(error);
      setLoadingStates1((prevStates) => ({
        ...prevStates,
        dailyReportDownload: false,
      }));
    }
  }; //✅

  const mailDailyDIVSummary = async (e) => {
    setShowLoader(true);
    e.preventDefault();
    setLoadingStates1((prevStates) => ({
      ...prevStates,
      mailDailyDIVSummary: true,
    }));
    try {
      const response = await api.get('/pdf/daily/mail-daily-reports/', {
        params: { date: date },
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      });
      setLoadingStates1((prevStates) => ({
        ...prevStates,
        mailDailyDIVSummary: false,
      }));
      showWarning(
        `Mail Daily DIV Summary ${response.data.message}`,
        'green',
        50000
      );
    } catch (error) {
      setShowLoader(false);
      console.log(error);
    } finally {
      setShowLoader(false);
      setLoadingStates1((prevStates) => ({
        ...prevStates,
        mailDailyDIVSummary: false,
      }));
    }
  }; //✅

  const DailyReportReview = async (e) => {
    setShowLoader(true);
    e.preventDefault();
    try {
      setLoadingStates2((prevStates) => ({
        ...prevStates,
        dailyReportReview: true,
      }));
      const response = await api.get('/pdf/daily/', {
        params: { date: date, pdf_for: 'daily_report' },
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url);
      setLoadingStates2((prevStates) => ({
        ...prevStates,
        dailyReportReview: false,
      }));
      setShowLoader(false);
      showWarning(`Daily Report is open at ==> ${url}`, 'green', 50000);
    } catch (error) {
      setShowLoader(false);
      console.error(error);
      setLoadingStates2((prevStates) => ({
        ...prevStates,
        dailyReportReview: false,
      }));
    }
  }; //✅

  const dailySummaryImgReview = async (e) => {
    setShowLoader(true);
    e.preventDefault();
    try {
      setLoadingStates2((prevStates) => ({
        ...prevStates,
        dailySummaryImgReview: true,
      }));
      const response = await api.get('/pdf/daily/', {
        params: {
          date: date,
          pdf_for: 'daily_summary_images',
          unique_variable: 'review',
        },
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url);
      setLoadingStates2((prevStates) => ({
        ...prevStates,
        dailySummaryImgReview: false,
      }));
      setShowLoader(false);
      showWarning(
        `Daily Summary with Images is open at ==> ${url}`,
        'green',
        50000
      );
    } catch (error) {
      setShowLoader(false);
      console.error(error);
      setLoadingStates2((prevStates) => ({
        ...prevStates,
        dailySummaryImgReview: false,
      }));
    }
  }; //✅

  const dailySummaryImgMail = async (e) => {
    setShowLoader(true);
    e.preventDefault();
    try {
      setLoadingStates1((prevStates) => ({
        ...prevStates,
        dailySummaryImgMail: true,
      }));
      const response = await api.get('/pdf/daily/', {
        params: {
          date: date,
          pdf_for: 'daily_summary_images',
          pdf_method: 'MAIL',
          unique_variable: 'download',
        },
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      });
      setShowLoader(false);
      showWarning(`DailySummary: ${response.data.message}`, 'green', 50000);
      setLoadingStates1((prevStates) => ({
        ...prevStates,
        dailySummaryImgMail: false,
      }));
    } catch (error) {
      setShowLoader(false);
      console.error(error);
      setShowLoader(false);
      setLoadingStates1((prevStates) => ({
        ...prevStates,
        dailySummaryImgMail: false,
      }));
    }
  }; //✅

  // const monthlySummaryDownload = async (e) => {
  //   setShowLoader(true);
  //   e.preventDefault();
  //   try {
  //     setLoadingStates1((prevStates) => ({
  //       ...prevStates,
  //       monthlySummaryDownload: true,
  //     }));
  //     var response;
  //     if (
  //       stationCategory === 'B' ||
  //       stationCategory === 'D' ||
  //       stationCategory === 'E'
  //     ) {
  //       response = await api.get(
  //         '/pdf/monthly/bde/',
  //         { params: { date: date } },
  //         {
  //           headers: {
  //             'Content-Type': 'application/json',
  //             'X-CSRFToken': '{{ csrf_token }}',
  //           },
  //         }
  //       );
  //     } else {
  //       response = await api.get(
  //         '/pdf/monthly/',
  //         { params: { date: date, pdf_for: 'monthly_summary' } },
  //         {
  //           headers: {
  //             'Content-Type': 'application/json',
  //             'X-CSRFToken': '{{ csrf_token }}',
  //           },
  //         }
  //       );
  //     }

  //     setShowLoader(false);
  //     setLoadingStates1((prevStates) => ({
  //       ...prevStates,
  //       monthlySummaryDownload: false,
  //     }));
  //     const contentLength = response.headers.get('Content-Length');
  //     console.log('The PDF just downloaded have:', contentLength);
  //     if (!contentLength || Number(contentLength) < 1024) {
  //       console.error(
  //         'The PDF file is empty or corrupted or its size is less than 1KB.'
  //       );
  //       setShowIssueInPDFDownloadModal(true);
  //       return;
  //     } else {
  //       showWarning(
  //         'Monthly Summary is Downloaded successfully!!',
  //         'green',
  //         50000
  //       );
  //       const blob = new Blob([response.data], { type: 'application/pdf' });
  //       // eslint-disable-next-line no-undef
  //       if (typeof AndroidInterface === 'undefined') {
  //         const url = window.URL.createObjectURL(blob);
  //         const link = document.createElement('a');
  //         link.href = url;
  //         link.download = `${station}_monthly_summary_${dateConverter(
  //           date
  //         )}.pdf`;
  //         link.click();
  //         window.URL.revokeObjectURL(url);
  //       } else {
  //         blobToBase64(blob).then((base64) => {
  //           // eslint-disable-next-line no-undef
  //           AndroidInterface.base64toFile(
  //             base64,
  //             `${station}_monthly_summary_${dateConverter(date)}.pdf`,
  //             'pdf'
  //           );
  //         });
  //       }
  //     }
  //   } catch (error) {
  //     setShowLoader(false);
  //     console.error(error);
  //     setLoadingStates1((prevStates) => ({
  //       ...prevStates,
  //       monthlySummaryDownload: false,
  //     }));
  //   }
  // }; //✅

  // const Downloadmonthlysummaryimages = async (e) => {
  //   e.preventDefault();
  //   setShowLoader(true);
  //   try {
  //     setLoadingStates1((prevStates) => ({
  //       ...prevStates,
  //       monthlysummaryimages: true,
  //     }));
  //     var response;
  //     if (
  //       stationCategory === 'B' ||
  //       stationCategory === 'D' ||
  //       stationCategory === 'E'
  //     ) {
  //       response = await api.get(
  //         '/pdf/monthly/bde/',
  //         { params: { date: date, pdf_method: 'MAIL' } },
  //         {
  //           headers: {
  //             'Content-Type': 'application/json',
  //             'X-CSRFToken': '{{ csrf_token }}',
  //           },
  //         }
  //       );
  //     } else {
  //       response = await api.get('pdf/monthly/', {
  //         params: {
  //           date: date,
  //           pdf_for: 'monthly_summary_images',
  //           show_images: true,
  //         },
  //         headers: {
  //           'Content-Type': 'application/json',
  //           'X-CSRFToken': '{{ csrf_token }}',
  //         },
  //       });
  //     }
  //     setShowLoader(false);
  //     setLoadingStates1((prevStates) => ({
  //       ...prevStates,
  //       monthlysummaryimages: false,
  //     }));
  //     const contentLength = response.headers.get('Content-Length');
  //     console.log('The PDF just downloaded have:', contentLength);
  //     if (!contentLength || Number(contentLength) < 1024) {
  //       console.error(
  //         'The PDF file is empty or corrupted or its size is less than 1KB.'
  //       );
  //       setShowIssueInPDFDownloadModal(true);
  //       return;
  //     } else {
  //       showWarning(`MonthlySummary: ${response.data.message}`, 'green', 50000);
  //       const blob = new Blob([response.data], { type: 'application/pdf' });
  //       // eslint-disable-next-line no-undef
  //       if (typeof AndroidInterface === 'undefined') {
  //         const url = window.URL.createObjectURL(blob);
  //         const link = document.createElement('a');
  //         link.href = url;
  //         link.download = `${station}_monthly_summary_with_images${dateConverter(
  //           date
  //         )}.pdf`;
  //         link.click();
  //         window.URL.revokeObjectURL(url);
  //       } else {
  //         blobToBase64(blob).then((base64) => {
  //           // eslint-disable-next-line no-undef
  //           AndroidInterface.base64toFile(
  //             base64,
  //             `${station}_daily_report_${dateConverter(date)}.pdf`,
  //             'pdf'
  //           );
  //         });
  //       }
  //     }
  //   } catch (error) {
  //     setShowLoader(false);
  //     console.error(error);
  //   } finally {
  //     setLoadingStates1((prevStates) => ({
  //       ...prevStates,
  //       monthlySummaryMail: false,
  //     }));
  //     setShowLoader(false);
  //   }
  // }; //✅

  const downloadconsolidatedpdf = async (e) => {
    setShowLoader(true);
    e.preventDefault();
    try {
      setLoadingStates1((prevStates) => ({
        ...prevStates,
        downloadconsolidatedpdf: true,
      }));
      var response;
      response = await api.get(
        `pdf/daily/bde-consolidated/`,
        { params: { date: date } },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': '{{ csrf_token }}',
          },
        }
      );
      setShowLoader(false);
      setLoadingStates1((prevStates) => ({
        ...prevStates,
        downloadconsolidatedpdf: false,
      }));
      const contentLength = response.headers.get('Content-Length');
      console.log('The PDF just downloaded have:', contentLength);
      if (!contentLength || Number(contentLength) < 1024) {
        console.error(
          'The PDF file is empty or corrupted or its size is less than 1KB.'
        );
        setShowIssueInPDFDownloadModal(true);
        return;
      } else {
        showWarning(
          ' Download consolidated pdf downloaded successfully!!',
          'green',
          50000
        );
        const blob = new Blob([response.data], { type: 'application/pdf' });
        // eslint-disable-next-line no-undef
        if (typeof AndroidInterface === 'undefined') {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `BDE_Consolidated_Pdf_${dateConverter(date)}.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);
        } else {
          blobToBase64(blob).then((base64) => {
            // eslint-disable-next-line no-undef
            AndroidInterface.base64toFile(
              base64,
              `BDE_Conolidated_Pdf_${dateConverter(date)}.pdf`,
              'pdf'
            );
          });
        }
      }
    } catch (error) {
      setShowLoader(false);
      console.error(error);
      setShowLoader(false);
      setLoadingStates1((prevStates) => ({
        ...prevStates,
        downloadconsolidatedpdf: false,
      }));
    }
  }; //✅

  const mailconsolidatedpdf = async (e) => {
    setShowLoader(true);
    e.preventDefault();
    try {
      setLoadingStates1((prevStates) => ({
        ...prevStates,
        mailconsolidatedpdf: true,
      }));
      const response = await api.get(`pdf/daily/bde-consolidated/`, {
        params: {
          date: date,
          pdf_method: 'MAIL',
        },
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      });
      setShowLoader(false);
      showWarning(
        `Mail_Consolidated_Pdf: ${response.data.message}`,
        'green',
        50000
      );
      setLoadingStates1((prevStates) => ({
        ...prevStates,
        mailconsolidatedpdf: false,
      }));
    } catch (error) {
      setShowLoader(false);
      console.error(error);
      setShowLoader(false);
      setLoadingStates1((prevStates) => ({
        ...prevStates,
        mailconsolidatedpdf: false,
      }));
    }
  }; //✅

  const monthlySummaryReview = async (e) => {
    setShowLoader(true);
    e.preventDefault();
    try {
      setLoadingStates2((prevStates) => ({
        ...prevStates,
        monthlySummaryReview: true,
      }));
      var response;
      if (
        stationCategory === 'B' ||
        stationCategory === 'D' ||
        stationCategory === 'E'
      ) {
        response = await api.get(
          '/pdf/monthly/bde/',
          { params: { date: date } },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': '{{ csrf_token }}',
            },
          }
        );
      } else {
        response = await api.get(
          '/pdf/monthly/',
          { params: { date: date, pdf_for: 'monthly_summary' } },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': '{{ csrf_token }}',
            },
          }
        );
      }
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url);
      setLoadingStates2((prevStates) => ({
        ...prevStates,
        monthlySummaryReview: false,
      }));
      setShowLoader(false);
      showWarning(`Monthly Summary is open at ==> ${url}`, 'green', 50000);
    } catch (error) {
      setShowLoader(false);
      console.error(error);
      setLoadingStates2((prevStates) => ({
        ...prevStates,
        monthlySummaryReview: false,
      }));
    }
  }; //✅

  const monthlySummaryMail = async (e) => {
    setShowLoader(true);
    e.preventDefault();
    try {
      setLoadingStates1((prevStates) => ({
        ...prevStates,
        monthlySummaryMail: true,
      }));
      var response;
      if (
        stationCategory === 'B' ||
        stationCategory === 'D' ||
        stationCategory === 'E'
      ) {
        response = await api.get(
          '/pdf/monthly/bde/',
          { params: { date: date, pdf_method: 'MAIL' } },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': '{{ csrf_token }}',
            },
          }
        );
      } else {
        response = await api.get('/pdf/monthly/', {
          params: {
            date: date,
            pdf_for: 'monthly_summary',
            pdf_method: 'MAIL',
          },
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': '{{ csrf_token }}',
          },
        });
      }
      setLoadingStates1((prevStates) => ({
        ...prevStates,
        monthlySummaryMail: false,
      }));
      setShowLoader(false);
      showWarning(`MonthlySummary: ${response.data.message}`, 'green', 50000);
    } catch (error) {
      setShowLoader(false);
      console.error(error);
      setLoadingStates1((prevStates) => ({
        ...prevStates,
        monthlySummaryMail: false,
      }));
    }
  }; //✅

  const MonthlyDetailsReview = async (e) => {
    setShowLoader(true);
    e.preventDefault();
    try {
      setLoadingStates2((prevStates) => ({
        ...prevStates,
        monthlyDetailsReview: true,
      }));
      var response;
      if (
        stationCategory === 'B' ||
        stationCategory === 'D' ||
        stationCategory === 'E'
      ) {
        response = await api.get(
          '/pdf/monthly/bde/',
          { params: { date: date } },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': '{{ csrf_token }}',
            },
          }
        );
      } else {
        response = await api.get(
          '/pdf/monthly/',
          { params: { date: date, pdf_for: 'monthly_details' } },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': '{{ csrf_token }}',
            },
          }
        );
      }
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url);
      setLoadingStates2((prevStates) => ({
        ...prevStates,
        monthlyDetailsReview: false,
      }));
      setShowLoader(false);
      showWarning(`Monthly Details is open at ==> ${url}`, 'green', 50000);
    } catch (error) {
      setShowLoader(false);
      console.error(error);
      setLoadingStates2((prevStates) => ({
        ...prevStates,
        monthlyDetailsReview: false,
      }));
    }
  }; //✅

  const MonthlyDetailsImgMail = async (e) => {
    setShowLoader(true);
    e.preventDefault();
    try {
      setLoadingStates1((prevStates) => ({
        ...prevStates,
        monthlyDetailsImgMail: true,
      }));
      var response;
      if (
        stationCategory === 'B' ||
        stationCategory === 'D' ||
        stationCategory === 'E'
      ) {
        response = await api.get(
          '/pdf/monthly/mail-daily-reports/',
          { params: { date: date, show_images: 'YES' } },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': '{{ csrf_token }}',
            },
          }
        );
      } else {
        response = await api.get(
          'pdf/monthly/mail-daily-reports/',
          {
            params: { date: date, show_images: 'YES' },
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': '{{ csrf_token }}',
            },
          }
        );
      }

      setLoadingStates1((prevStates) => ({
        ...prevStates,
        monthlyDetailsImgMail: false,
      }));
      setShowLoader(false);
      showWarning(`MonthlyDetails: ${response.data.message}`, 'green', 50000);
    } catch (error) {
      setShowLoader(false);
      console.error(error);
      setLoadingStates1((prevStates) => ({
        ...prevStates,
        monthlyDetailsImgMail: false,
      }));
    }
  }; //✅

  const downloaddailycomplain = async (e) => {
    setShowLoader(true);
    e.preventDefault();
    try {
      setLoadingStates1((prevStates) => ({
        ...prevStates,
        downloaddailycomplain: true,
      }));
      const response = await api.get(`/pdf/complaints/details/${date}`, {
        params: {
          download: 'download',
          complaint_range: 'day',
        },
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      });
      setShowLoader(false);
      setLoadingStates1((prevStates) => ({
        ...prevStates,
        downloaddailycomplain: false,
      }));
      const contentLength = response.headers.get('Content-Length');
      console.log('The PDF just downloaded have:', contentLength);
      if (!contentLength || Number(contentLength) < 1024) {
        console.error(
          'The PDF file is empty or corrupted or its size is less than 1KB.'
        );
        setShowIssueInPDFDownloadModal(true);
        return;
      } else {
        showWarning(
          ' Download daily complain pdf downloaded successfully!!',
          'green',
          50000
        );
        const blob = new Blob([response.data], { type: 'application/pdf' });
        // eslint-disable-next-line no-undef
        if (typeof AndroidInterface === 'undefined') {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${station}_Download_Daily_Complain_${dateConverter(
            date
          )}.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);
        } else {
          blobToBase64(blob).then((base64) => {
            // eslint-disable-next-line no-undef
            AndroidInterface.base64toFile(
              base64,
              `${station}_Download_Daily_Complain_${dateConverter(date)}.pdf`,
              'pdf'
            );
          });
        }
      }
    } catch (error) {
      setShowLoader(false);
      console.error('Error fetching Complaint Report:', error);
      setLoadingStates1((prevStates) => ({
        ...prevStates,
        downloaddailycomplain: false,
      }));
    }
  }; //✅
  const downloadmonthlycomplain = async (e) => {
    setShowLoader(true);
    e.preventDefault();
    try {
      setLoadingStates1((prevStates) => ({
        ...prevStates,
        downloadmonthlycomplain: true,
      }));
      const response = await api.get(`/pdf/complaints/details/${date}`, {
        params: {
          download: 'download',
          complaint_range: 'month',
        },
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      });
      setShowLoader(false);
      setLoadingStates1((prevStates) => ({
        ...prevStates,
        downloadmonthlycomplain: false,
      }));
      const contentLength = response.headers.get('Content-Length');
      console.log('The PDF just downloaded have:', contentLength);
      if (!contentLength || Number(contentLength) < 1024) {
        console.error(
          'The PDF file is empty or corrupted or its size is less than 1KB.'
        );
        setShowIssueInPDFDownloadModal(true);
        return;
      } else {
        showWarning(
          ' Download monthly complain pdf downloaded successfully!!',
          'green',
          50000
        );
        const blob = new Blob([response.data], { type: 'application/pdf' });
        // eslint-disable-next-line no-undef
        if (typeof AndroidInterface === 'undefined') {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${station}_Download_Monthly_Complain_${dateConverter(
            date
          )}.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);
        } else {
          blobToBase64(blob).then((base64) => {
            // eslint-disable-next-line no-undef
            AndroidInterface.base64toFile(
              base64,
              `${station}_Download_Monthly_Complain_${dateConverter(date)}.pdf`,
              'pdf'
            );
          });
        }
      }
    } catch (error) {
      setShowLoader(false);
      console.error('Error fetching Complaint Report:', error);
      setLoadingStates1((prevStates) => ({
        ...prevStates,
        downloadmonthlycomplain: false,
      }));
    }
  }; //✅
  const maildailycomplain = async (e) => {
    setShowLoader(true);
    e.preventDefault();
    try {
      setLoadingStates1((prevStates) => ({
        ...prevStates,
        maildailycomplain: true,
      }));
      const response = await api.get(`/pdf/complaints/details/${date}`, {
        params: { pdf_method: 'MAIL', complaint_range: 'day' },
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      });
      setLoadingStates1((prevStates) => ({
        ...prevStates,
        maildailycomplain: false,
      }));
      showWarning(
        ` mail Daily Report : ${response.data.message}`,
        'green',
        50000
      );
      setShowLoader(false);
    } catch (error) {
      setShowLoader(false);
      console.log(error);
      setLoadingStates1((prevStates) => ({
        ...prevStates,
        maildailycomplain: false,
      }));
    }
  }; //✅
  const mailmonthlycomplain = async (e) => {
    setShowLoader(true);
    e.preventDefault();
    try {
      setLoadingStates1((prevStates) => ({
        ...prevStates,
        mailmonthlycomplain: true,
      }));
      const response = await api.get(`/pdf/complaints/details/${date}`, {
        params: { pdf_method: 'MAIL', complaint_range: 'month' },
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      });
      setLoadingStates1((prevStates) => ({
        ...prevStates,
        mailmonthlycomplain: false,
      }));
      showWarning(
        ` mail Daily Report : ${response.data.message}`,
        'green',
        50000
      );
      setShowLoader(false);
    } catch (error) {
      setShowLoader(false);
      console.log(error);
      setLoadingStates1((prevStates) => ({
        ...prevStates,
        mailmonthlycomplain: false,
      }));
    }
  }; //✅
  const reviewdailycomplain = async (e) => {
    setShowLoader(true);
    e.preventDefault();
    try {
      setLoadingStates2((prevStates) => ({
        ...prevStates,
        reviewdailycomplain: true,
      }));
      const response = await api.get(`/pdf/complaints/details/${date}`, {
        params: {
          complaint_range: 'day',
        },
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url);
      setLoadingStates2((prevStates) => ({
        ...prevStates,
        reviewdailycomplain: false,
      }));
      setShowLoader(false);
    } catch (error) {
      setShowLoader(false);
      console.error(error);
      setLoadingStates2((prevStates) => ({
        ...prevStates,
        reviewdailycomplain: false,
      }));
    }
  }; //✅
  const reviewmonthlycomplain = async (e) => {
    setShowLoader(true);
    e.preventDefault();
    try {
      setLoadingStates2((prevStates) => ({
        ...prevStates,
        reviewmonthlycomplain: true,
      }));

      const response = await api.get(`/pdf/complaints/details/${date}`, {
        params: {
          complaint_range: 'month',
        },
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url);
      setLoadingStates2((prevStates) => ({
        ...prevStates,
        reviewmonthlycomplain: false,
      }));
      setShowLoader(false);
    } catch (error) {
      setShowLoader(false);
      console.error(error);
      setLoadingStates2((prevStates) => ({
        ...prevStates,
        reviewmonthlycomplain: false,
      }));
    }
  }; //✅
  const reviewconsolidatedpdf = async (e) => {
    setShowLoader(true);
    e.preventDefault();
    try {
      setLoadingStates2((prevStates) => ({
        ...prevStates,
        reviewconsolidatedpdf: true,
      }));

      const response = await api.get(
        `pdf/daily/bde-consolidated/`,
        { params: { date: date } },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': '{{ csrf_token }}',
          },
        }
      );
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url);
      setLoadingStates2((prevStates) => ({
        ...prevStates,
        reviewconsolidatedpdf: false,
      }));
      setShowLoader(false);
    } catch (error) {
      setShowLoader(false);
      console.error(error);
      setLoadingStates2((prevStates) => ({
        ...prevStates,
        reviewconsolidatedpdf: false,
      }));
    }
  };
  return (
    <React.Fragment>
      <ErrorModal flag={errorModalFlag} message={errorMsg} />
      <div className="loader">
        {showLoader && <Loader />}
        {error && (
          <CModal
            visible={showConfirmationModal}
            backdrop="static"
            aria-labelledby="ConfirmationModal"
          >
            <CModalBody>
              <h5 className="text-red-700">{error}</h5>
            </CModalBody>
          </CModal>
        )}
      </div>
      {showOutOfServiceModal && (
        <CModal
          visible={showOutOfServiceModal}
          backdrop="static"
          aria-labelledby="ConfirmationModal"
        >
          <CModalBody>
            <h5 className="text-red-600 text-center">
              Please again try after 21st April. <br />
              This feature is under maintenance.
            </h5>
          </CModalBody>
          <CModalFooter>
            <CButton
              color="secondary"
              onClick={() => setShowOutOfServiceModal(false)}
            >
              Close
            </CButton>
          </CModalFooter>
        </CModal>
      )}
      {showIssueInPDFDownload && (
        <CModal
          visible={showIssueInPDFDownload}
          backdrop="static"
          aria-labelledby="ConfirmationModal"
        >
          <CModalBody>
            <h5 className="text-red-600 text-center">
              There is issue in the Downloaded PDF file, Please try agian.
            </h5>
          </CModalBody>
          <CModalFooter>
            <CButton
              color="secondary"
              onClick={() => setShowIssueInPDFDownloadModal(false)}
            >
              Close
            </CButton>
          </CModalFooter>
        </CModal>
      )}
      {useMailModal && (
        <CModal
          visible={useMailModal}
          backdrop="static"
          aria-labelledby="ConfirmationModal"
        >
          <CModalBody>
            <h5 className="text-red-600 text-center">
              Please use Mail Moathly Summary. <br />
              Download will be available after 3rd April.
            </h5>
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={() => setUseMailModal(false)}>
              Close
            </CButton>
          </CModalFooter>
        </CModal>
      )}
      <div className="page-body pt-3">
        {previewData ? (
          <ReviewPassengerFeedbackScreen htmlContent={htmlData} />
        ) : (
          <div>
            <div>
              <Navbar
                displaySidebar={displaySidebar}
                toggleSideBar={toggleSideBar}
                visibilityData={{ visibleModal, setVisibleModal }}
                urlData={{ url, setUrl }}
                scoreNowData={{ scoreNow, setScoreNow }}
                complainData={{ onComplain, setonComplain }}
                stationChange={{ selectStation, setSelectStation }}
              />
            </div>
            <div
              style={{
                marginLeft:
                  displaySidebar === true
                    ? window.innerWidth > 991
                      ? '230px'
                      : '0px'
                    : '0px',
              }}
            >
              <div className="flex flex-col items-center justify-evenly">
                <div className="second-div max-sm:mt-20 md:mt-16 flex flex-col justify-center items-center">
                  {warning && (
                    <span>
                      {warning.content ? (
                        <div className="rating-comment-upload-main">
                          <div className="rating-comment-upload">
                            <div
                              className="header-container text-center flex justify-center items-center mb-4"
                              style={{ color: `${warning.color}` }}
                            >
                              {warning.content}
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </span>
                  )}
                  <div className="flex border-1 rounded border-black w-min h-min">
                    <input
                      type="date"
                      name="date"
                      required
                      className="text-lg p-2 mx-auto flex rounded justify-center w-60"
                      value={date}
                      onChange={(e) => {
                        checkDate(e.target.value);
                      }}
                    />
                  </div>
                  <div className="container1">
                    <div className="left-buttons">
                      <div className="button-container1">
                        <button
                          className="pdf_btn"
                          onClick={DailyBuyersSheetDownload}
                          disabled={loadingStates1.dailyBuyersSheetDownload}
                        >
                          {loadingStates1.dailyBuyersSheetDownload
                            ? 'Downloading...'
                            : "Download Daily Buyer's Rating Sheet"}
                        </button>
                        {/* change1  */}
                        <button
                          className="pdf_btn"
                          onClick={mailDailyBuyerRating}
                          disabled={loadingStates1.mailDailyBuyerRating}
                        >
                          {loadingStates1.mailDailyBuyerRating
                            ? 'Mailing...'
                            : "Mail Daily Buyer's Rating Sheet"}
                        </button>
                        <button
                          type="submit"
                          className="pdf_btn"
                          disabled={loadingStates1.dailySummaryDownload}
                          onClick={dailySummaryDownload}
                        >
                          {loadingStates1.dailySummaryDownload
                            ? 'Downloading...'
                            : 'Download Daily Summary'}
                        </button>
                        {/* change 2 */}
                        <button
                          type="submit"
                          className="pdf_btn"
                          disabled={loadingStates1.mailDailySummary}
                          onClick={mailDailySummary}
                        >
                          {loadingStates1.mailDailySummary
                            ? 'Mailing...'
                            : 'Mail Daily Summary'}
                        </button>
                        <button
                          type="submit"
                          className="pdf_btn"
                          disabled={loadingStates1.dailySummaryImgMail}
                          onClick={dailySummaryImgMail}
                          // onClick={() => setShowOutOfServiceModal(true)}
                        >
                          {loadingStates1.dailySummaryImgMail
                            ? 'Mailing...'
                            : 'Mail Daily Summary (images)'}
                        </button>
                        <button
                          type="submit"
                          className="pdf_btn"
                          disabled={loadingStates1.dailyReportDownload}
                          onClick={DailyReportDownload}
                        >
                          {loadingStates1.dailyReportDownload
                            ? 'Downloading...'
                            : 'Download Daily Report'}
                        </button>
                        {/* change3 */}
                        <button
                          type="submit"
                          className="pdf_btn"
                          disabled={loadingStates1.mailDailyReport}
                          onClick={mailDailyReport}
                        >
                          {loadingStates1.mailDailyReport
                            ? 'Mailing...'
                            : 'Mail Daily Report'}
                        </button>
                        {/* <button
                          type="submit"
                          className="pdf_btn"
                          disabled={loadingStates1.monthlySummaryDownload}
                          onClick={monthlySummaryDownload}
                          // onClick={() => {
                          //   setUseMailModal(true);
                          // }}
                        >
                          {loadingStates1.monthlySummaryDownload
                            ? 'Downloading...'
                            : 'Download Monthly Summary'}
                        </button> */}
                        {/* <button
                          type="submit"
                          className="pdf_btn"
                          disabled={loadingStates1.monthlysummaryimages}
                          onClick={Downloadmonthlysummaryimages}
                        >
                          {loadingStates1.monthlysummaryimages
                            ? 'Downloading...'
                            : 'Download Monthly Summary (Images)'}
                        </button> */}
                        <button
                          type="submit"
                          className="pdf_btn"
                          disabled={loadingStates1.monthlySummaryMail}
                          onClick={monthlySummaryMail}
                        >
                          {loadingStates1.monthlySummaryMail
                            ? 'Mailing...'
                            : 'Mail Monthly Summary'}
                        </button>

                        <button
                          type="submit"
                          className="pdf_btn"
                          disabled={loadingStates1.monthlyDetailsImgMail}
                          onClick={MonthlyDetailsImgMail}
                          // onClick={() => setShowOutOfServiceModal(true)}
                        >
                          {loadingStates1.monthlyDetailsImgMail
                            ? 'Mailing...'
                            : 'Mail Monthly Details (images)'}
                        </button>

                        {['railway admin', 'officer', 'manager', 's2 admin'].includes(
                          userType
                        ) && (
                          <button
                            type="submit"
                            className="pdf_btn"
                            disabled={loadingStates1.downloaddailycomplain}
                            onClick={downloaddailycomplain}
                          >
                            {loadingStates1.downloaddailycomplain
                              ? 'Processing...'
                              : 'Download Daily Complain'}
                          </button>
                        )}
                        {['railway admin', 'officer', 'manager', 's2 admin'].includes(
                          userType
                        ) && (
                          <button
                            type="submit"
                            className="pdf_btn"
                            disabled={loadingStates1.maildailycomplain}
                            onClick={maildailycomplain}
                          >
                            {loadingStates1.maildailycomplain
                              ? 'Processing...'
                              : 'Mail Daily Complain'}
                          </button>
                        )}
                        {['railway admin', 'officer', 'manager', 's2 admin'].includes(
                          userType
                        ) && (
                          <button
                            type="submit"
                            className="pdf_btn"
                            disabled={loadingStates1.downloadmonthlycomplain}
                            onClick={downloadmonthlycomplain}
                          >
                            {loadingStates1.downloadmonthlycomplain
                              ? 'Processing...'
                              : 'Download Monthly Complain'}
                          </button>
                        )}
                        {['railway admin', 'officer', 'manager', 's2 admin'].includes(
                          userType
                        ) && (
                          <button
                            type="submit"
                            className="pdf_btn"
                            disabled={loadingStates1.mailmonthlycomplain}
                            onClick={mailmonthlycomplain}
                          >
                            {loadingStates1.mailmonthlycomplain
                              ? 'Processing...'
                              : 'Mail Monthly Complain'}
                          </button>
                        )}

                        <button
                          type="submit"
                          className="pdf_btn"
                          disabled={loadingStates1.downloadconsolidatedpdf}
                          onClick={downloadconsolidatedpdf}
                        >
                          {loadingStates1.downloadconsolidatedpdf
                            ? 'Processing...'
                            : 'Download Consolidated Pdf'}
                        </button>

                        <button
                          type="submit"
                          className="pdf_btn"
                          disabled={loadingStates1.mailconsolidatedpdf}
                          onClick={mailconsolidatedpdf}
                        >
                          {loadingStates1.mailconsolidatedpdf
                            ? 'Mailing...'
                            : 'Mail Consolidated Pdf'}
                        </button>

                        <button
                          type="submit"
                          className="pdf_btn"
                          disabled={loadingStates1.mailDailyDIVSummary}
                          onClick={mailDailyDIVSummary}
                        >
                          {loadingStates1.mailDailyDIVSummary
                            ? 'Mailing...'
                            : 'Mail Daily DIV Summary'}
                        </button>
                        {/* <button
                          type="submit"
                          className="pdf_btn"
                          disabled={loadingStates1.dailySummaryDownload}
                          onClick={dailySummaryDownloadBDE}
                        >
                          {loadingStates1.dailySummaryDownloadBDE
                            ? 'Downloading...'
                            : 'Download Monthly Summary (BDE)'}
                        </button> */}
                        <button
                          type="button"
                          className="pdf_btn"
                          disabled={loadingStates1.mailmonthlysummaryBDE}
                          onClick={mailmonthlysummaryBDE}
                        >
                          {loadingStates1.mailmonthlysummaryBDE
                            ? 'Mailing...'
                            : 'Mail Monthly Summary (BDE)'}
                        </button>
                      </div>
                    </div>
                    <div className="right-buttons max-sm:hidden">
                      <div className="button-container1">
                        <button
                          type="submit"
                          className="pdf_btn"
                          disabled={loadingStates2.dailyBuyersSheetReview}
                          onClick={DailyBuyersSheetReview}
                        >
                          {loadingStates2.dailyBuyersSheetReview
                            ? 'Reviewing...'
                            : "Review Daily Buyer's Rating Sheet"}
                        </button>
                        <button
                          type="submit"
                          className="pdf_btn"
                          disabled={loadingStates2.dailySummaryReview}
                          onClick={dailySummaryReview}
                        >
                          {loadingStates2.dailySummaryReview
                            ? 'Reviewing...'
                            : 'Review Daily Summary'}
                        </button>
                        <button
                          type="submit"
                          className="pdf_btn"
                          disabled={loadingStates2.dailyReportReview}
                          onClick={DailyReportReview}
                        >
                          {loadingStates2.dailyReportReview
                            ? 'Reviewing...'
                            : 'Review Daily Report'}
                        </button>
                        <button
                          type="submit"
                          className="pdf_btn"
                          disabled={loadingStates2.dailySummaryImgReview}
                          onClick={dailySummaryImgReview}
                          // onClick={() => setShowOutOfServiceModal(true)}
                        >
                          {loadingStates2.dailySummaryImgReview
                            ? 'Reviewing...'
                            : 'Review Daily Summary (images)'}
                        </button>

                        <button
                          type="submit"
                          className="pdf_btn"
                          disabled={loadingStates2.monthlySummaryReview}
                          onClick={monthlySummaryReview}
                        >
                          {loadingStates2.monthlySummaryReview
                            ? 'Reviewing...'
                            : 'Review Monthly Summary'}
                        </button>

                        <button
                          type="submit"
                          className="pdf_btn"
                          disabled={loadingStates2.monthlyDetailsReview}
                          onClick={MonthlyDetailsReview}
                        >
                          {loadingStates2.monthlyDetailsReview
                            ? 'Reviewing...'
                            : 'Review Monthly Details'}
                        </button>

                        {['railway admin', 'officer', 'manager', 's2 admin'].includes(
                          userType
                        ) && (
                          <button
                            type="submit"
                            className="pdf_btn"
                            disabled={loadingStates2.reviewdailycomplain}
                            onClick={reviewdailycomplain}
                          >
                            {loadingStates2.reviewdailycomplain
                              ? 'Processing...'
                              : 'Review Daily Complain'}
                          </button>
                        )}

                        {['railway admin', 'officer', 'manager', 's2 admin'].includes(
                          userType
                        ) && (
                          <button
                            type="submit"
                            className="pdf_btn"
                            disabled={loadingStates2.reviewmonthlycomplain}
                            onClick={reviewmonthlycomplain}
                          >
                            {loadingStates2.reviewmonthlycomplain
                              ? 'Processing...'
                              : 'Review Monthly Complain '}
                          </button>
                        )}

                        <button
                          type="submit"
                          className="pdf_btn"
                          disabled={loadingStates1.reviewconsolidatedpdf}
                          onClick={reviewconsolidatedpdf}
                        >
                          {loadingStates2.reviewconsolidatedpdf
                            ? 'Reviewing...'
                            : 'Review Consolidated Pdf'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </React.Fragment>
  );
};
export default Pdf_Screen;
