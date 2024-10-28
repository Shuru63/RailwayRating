import React from "react";

const BackgroundHeader = (props) => {
    return(
        <div className="background-header">
            <div className="background-header-color" style={{width: props.displaySidebar === true ? "calc(100% - 230px)":"100%"}}>
                <h5>{props.heading}</h5>
                <p>{props.subheading}</p>
            </div>
            <div className="background-header-img"></div>
        </div>
    )
}

export default BackgroundHeader