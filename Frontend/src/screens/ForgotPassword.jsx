import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../index.css'
import BackgroundPattern from '../components/BackgroundPattern';
import { CButton, CModal, CModalBody, CModalFooter } from '@coreui/react';
import { useState } from 'react';
import api from "../api/api";
import Loader from '../Loader';
import { useNavigate } from 'react-router-dom';
const ForgotPassword = () => {
    const [showModal, setShowModal] = useState(false);
    const [showErrorMsg, setShowErrorMsg] = useState('');
    const [showLoader, setShowLoader] = useState(false);
    const [email, setEmail] = useState();
    const navigate = useNavigate();
    const forgotPasswordHandler = (e) => {
        setShowLoader(true);
        e.preventDefault()
        api.post('/user/password_reset/', {
            'email': email
        }).then((response) => {
            setShowErrorMsg(response.data.message)
            setShowModal(true);
            setTimeout(() => {
                navigate('/');
            }, 5000);
        }).catch((error) => {
            setShowErrorMsg(error.response.data.message)
            setShowModal(true)
        }).finally(() => {
            setShowLoader(false)
        })
    }
    return (
        <div className='page-body'>
            <div>
                {
                    showLoader && <Loader></Loader>
                }
            </div>
            <div>
                <CModal
                    visible={showModal}
                    backdrop="static"
                    aria-labelledby="ScoreNow"
                >
                    <CModalBody>
                        <h5>{showErrorMsg}</h5>
                    </CModalBody>
                    <CModalFooter>
                        <CButton
                            color="secondary"
                            onClick={() => {
                                setShowModal(false);
                            }}
                        >
                            Ok
                        </CButton>
                    </CModalFooter>
                </CModal>
            </div>
            <BackgroundPattern />
            <div class="container p-5 mt-5 form-body">
                <h2 class="font-weight-bold mt-3">Reset Password</h2>
                <hr />
                <p>Forgotten your password? Enter your email address below, and we'll email instructions for setting a new one.</p>
                <form>
                    <div class="form-group">
                        <label for="email" style={{ marginTop: "-10%" }}>Email address</label>
                        <input type="email" class="form-control form-input" id="email" name="email" aria-describedby="emailHelp" placeholder="Enter email" onChange={(e) => { setEmail(e.target.value) }} />
                        <p id="emailHelp" class="form-text text-muted">We'll never share your email with anyone else.</p>
                    </div>
                    <button class="btn btn-primary" onClick={forgotPasswordHandler}>Send email</button>
                </form>
            </div>
        </div>
    )
}
export default ForgotPassword;