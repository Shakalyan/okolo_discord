import '../styles/Signin.css'
import Stack from 'react-bootstrap/Stack'
import Button from 'react-bootstrap/Button'
import Input from './general/ComplexInput.jsx'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import React from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { api_signup } from '../api.js';
import { useSelector } from 'react-redux'
import { CONST_STRS } from '../strs.js'

export default function Signup() {

    let loginInput = React.useRef();
    let passwordInput = React.useRef();
    let repeatPasswordInput = React.useRef();
    let resultTextArea = React.useRef();

    let navigate = useNavigate();
    let lang = useSelector((state) => state.lang.value);

    const [resultText, setResultText] = useState('');

    function signInClick(event) {
        navigate('/signin');
    }

    function signUpClick(event) {
        let login = loginInput.current.value;
        let password = passwordInput.current.value;
        if (password != repeatPasswordInput.current.value) {
            resultTextArea.current.className = "redtext";
            setResultText(CONST_STRS[lang].SIGNUP_PASSWORDS_MISMATCH);
            return;
        }
        api_signup(login, password).then((response) => {
            if (response.status == 200) {
                resultTextArea.current.className = "greentext";
                setResultText(CONST_STRS[lang].SIGNUP_SUCCESS);
            } else {
                response.text().then((text) => {
                    resultTextArea.current.className = "redtext";
                    if (response.status == 400) {
                        if (text == "SHORT_LOGIN")
                            setResultText(CONST_STRS[lang].SIGNUP_SHORT_LOGIN);
                        if (text == "SHORT_PASSWORD")
                            setResultText(CONST_STRS[lang].SIGNUP_SHORT_PASSWORD);
                        if (text == "LOGIN_IS_USED")
                            setResultText(CONST_STRS[lang].SIGNUP_LOGIN_IS_USED);
                    }
                    if (response.status == 500)
                        setResultText(CONST_STRS[lang].SERVER_ERROR);
                });
            }
        });
    }

    return (
        <Stack id="signin_container" gap={3}>
            <Container>
                <Row>
                    <Col style={{ paddingLeft: 0, paddingRight: 0 }}>
                        <h2>Sign up</h2>
                    </Col>
                    <Col style={{ paddingLeft: 0, paddingRight: 0 }}>
                        <p ref={resultTextArea}>{resultText}</p>
                    </Col>
                </Row>
            </Container>
            <Input text="Login" type="text" ref={loginInput}/>
            <Input text="Password" type="password" ref={passwordInput}/>
            <Input text="Repeat password" type="password" ref={repeatPasswordInput}/>
            <Button variant='light' size='sm' onClick={signUpClick}>Sign up</Button>
            <Button variant='light' size='sm' onClick={signInClick}>Sign in</Button>
        </Stack>
    );
}