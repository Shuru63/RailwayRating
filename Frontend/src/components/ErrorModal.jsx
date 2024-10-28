import { useState, useEffect } from 'react';
import React from 'react'
import {
    CModal,
    CModalTitle,
    CModalBody,
    CModalFooter,
    CModalHeader,
    CButton,
} from '@coreui/react';


const ErrorModal = (props) => {

    const [showModal, setShowModal] = useState(false)

    useEffect(() => {
        setShowModal(props.flag)
        console.log(props)
        console.log(showModal)
    },[props])

    return (
        <div style={{position:"relative",zIndex: "100"}}>
            <CModal
                visible={showModal}
                onClose={() => {
                    setShowModal(false);
                }}
                aria-labelledby="date"
            >
                <CModalHeader
                    onClose={() => {
                        setShowModal(false);
                    }}
                >
                    <CModalTitle id="LiveDemoExampleLabel">Error</CModalTitle>
                </CModalHeader>
                <CModalBody>
                    {props.message}
                </CModalBody>
                <CModalFooter>
                    <CButton
                        color="secondary"
                        onClick={() => {
                            setShowModal(false);
                        }}
                    >
                        Close
                    </CButton>
                </CModalFooter>
            </CModal>
        </div>
    )
}

export default ErrorModal