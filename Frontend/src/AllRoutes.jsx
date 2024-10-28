import React from 'react';
import { Navigate } from 'react-router-dom';
import { Routes, Route } from 'react-router-dom';
import SignupScreen from './screens/signupScreen';
import WhatsAppLogin from './screens/whatsAppLogin';
import HomeScreen from './screens/HomeScreen';
import ChangePhone from './screens/changePhone';
import ChangeEmail from './screens/ChangeEmail';
import ChangePassword from './screens/ChangePassword';
import ReadRating from './screens/ReadRating';
import ReadRatingSpecificDate from './screens/ReadRatingSpecificDate';
import WriteRating from './screens/WriteRating';
import WriteRatingSpecificDate from './screens/WriteRatingSpecificDate';
import WriteShift from './screens/WriteShift';
import Login from './screens/Login';
import ForgotPassword from './screens/ForgotPassword';
import UserProfile from './screens/UserProfile';
import EditProfile from './screens/EditProfile';
import RequestedUser from './screens/RequestedUser';
import PdfScreen from './screens/Pdfscreen';
import InspectionFeedback from './screens/InspectionFeedback';
import Feedback from './screens/Feedback';
import Penalty from './screens/Penalty';
import GraphScreen from './screens/GraphScreen';
import EnableDisableUser from './screens/EnableDisableUser';
import Otp from './screens/Otp';
import AddRating from './screens/AddRating';
import Complain from './screens/Complain';
import RequestedAccess from './screens/RequestAccess';
import ImageView from './components/ImageView';
import WhatsAppLoginOtp from './screens/WhatsAppLoginOtp';
import EmailChangeOtp from './components/EmailChangeOtp';
import PasswordChangeOtp from './screens/PasswordChangeOtp';
import RouteLogger from './components/RouteLogger';
import CurrAddRating from './screens/CurrAddRating';
import AccessStations from './screens/AccessStations';
import MonitoringStations from './screens/MonitoringStations';

import ErrorPage from './screens/ErrorPage';
import AdminGivingPermission from './screens/AdminGivingPermission';
import VerifyMonthly from './screens/VerifyMonthly';
import ImageShowcase from './components/ImageShowcase';
import ManageTasks from './screens/ManageTasks';
import EditTasks from './screens/EditTasks';
import CreateTasks from './screens/CreateTasks';
import ManageContracts from './screens/ManageContracts';
import CreateContracts from './screens/CreateContracts';
import EditContracts from './screens/EditContracts';

const AllRoutes = () => {
  return (
    <div>
      <RouteLogger />
      <Routes>
        <Route path="/request-signup" element={<SignupScreen />} />
        <Route path="/sms-otp" element={<WhatsAppLogin />} />
        <Route path="/send-sms-otp" element={<WhatsAppLoginOtp />} />
        <Route path="/Home" element={<HomeScreen />} />
        <Route path="/verify-ratings" element={<VerifyMonthly />} />
        <Route
          path="/user/profile/edit-profile/change-phone"
          element={<ChangePhone />}
        />
        <Route
          path="/user/profile/edit-profile/change-email"
          element={<ChangeEmail />}
        />
        <Route path="/user/change_password" element={<ChangePassword />} />
        <Route path="/ReadRatingToday" element={<ReadRating />} />
        <Route
          path="/ReadRatingOnSpeFicDate"
          element={<ReadRatingSpecificDate />}
        />
        <Route path="/WriteRatingToday" element={<WriteRating />} />
        <Route
          path="/WriteRatingOnSpeFicDate"
          element={<WriteRatingSpecificDate />}
        />
        <Route path="/currShift" element={<WriteShift />} />
        <Route path="/ImageView" element={<ImageShowcase />} />
        <Route path="/" element={<Login />} />
        <Route path="/ForgotPassword" element={<ForgotPassword />} />
        <Route path="/UserProfile" element={<UserProfile />} />
        <Route path="/EditProfile" element={<EditProfile />} />
        <Route path="/requested-user" element={<RequestedUser />} />
        <Route path="/requested-Access" element={<RequestedAccess />} />
        <Route path="/whichpdf" element={<PdfScreen />} />
        <Route
          path="/GivePermissionByAdmin"
          element={<AdminGivingPermission />}
        />
        <Route path="/InspectionFeedback" element={<InspectionFeedback />} />
        <Route path="/Feedback" element={<Feedback />} />
        <Route path="/graph" element={<GraphScreen />} />
        <Route path="/penalty" element={<Penalty />} />
        <Route path="/enable-disable-user" element={<EnableDisableUser />} />
        <Route path="/enter_otp" element={<Otp />} />
        <Route path="/emailChange-otp" element={<EmailChangeOtp />} />
        <Route path="/passwordChange-otp" element={<PasswordChangeOtp />} />
        <Route path="/addrating" element={<AddRating />} />
        <Route path="/currAddrating" element={<CurrAddRating />} />
        <Route path="/Complain" element={<Complain />} />
        <Route
          path="/media/:id/:taskID/:shiftId/:occurenceId"
          element={<ImageView />}
        />
        <Route path="/accessStations" element={<AccessStations />} />
        <Route path="/monitoringStations" element={<MonitoringStations />} />
        <Route path="*" element={<Navigate to="/Home" />} />

        <Route path="/tasks" element={<ManageTasks />} />
        <Route path="/create-task/" element={<CreateTasks />} />
        <Route path="/edit-task/:id" element={<EditTasks />} />

        <Route path="/contracts" element={<ManageContracts />} />
        <Route path="/create-contract/" element={<CreateContracts />} />
        <Route path="/edit-contract/:id" element={<EditContracts />} />

        <Route path="/error" element={<ErrorPage />} />
      </Routes>
    </div>
  );
};

export default AllRoutes;
