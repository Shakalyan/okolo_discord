import '../styles/Signin.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button'
import Input from './general/ComplexInput.jsx'
import React from 'react'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { api_signin, api_ping } from '../api.js';
import { CONST_STRS } from '../strs.js';
import { useSelector } from 'react-redux';

export default function Signin() {

    const lang = useSelector((store) => store.lang.value);

    let loginInput = React.useRef();
    let passwordInput = React.useRef();
    let resultTextArea = React.useRef();
    let navigate = useNavigate();

    const [resultText, setResultText] = useState('');

    function signUpClick(event) {
        navigate('/signup');
    }

    function signInClick(event) {
        let login = loginInput.current.value;
        let password = passwordInput.current.value;
        api_signin(login, password).then((response) => {
            if (response.status == 200) {
                response.text().then((token) => {
                    localStorage.setItem('token', token);
                    navigate('/main');                    
                });                
            } else {
                let text = "";
                resultTextArea.current.className = "redtext";
                if (response.status == 400)
                    text = CONST_STRS[lang].SIGNIN_USER_DOES_NOT_EXIST;
                if (response.status == 401)
                    text = CONST_STRS[lang].SIGNIN_PASSWORD_IS_INCORRECT;
                if (response.status == 500)
                    text = CONST_STRS[lang].SERVER_ERROR;
                setResultText(text);
            }
        })
    }

    return (
        <Stack id="signin_container" gap={3}>
            <Container>
                <Row>
                    <Col style={{ paddingLeft: 0, paddingRight: 0 }}>
                        <h2>Sign in</h2>
                    </Col>
                    <Col style={{ paddingLeft: 0, paddingRight: 0 }}>
                        <p ref={resultTextArea}>{resultText}</p>
                    </Col>
                </Row>
            </Container>
            <Input text="Login" type="text" ref={loginInput}/>
            <Input text="Password" type="password" ref={passwordInput}/>
            <Button variant='light' size='sm' onClick={signInClick}>Sign in</Button>
            <Button variant='light' size='sm' onClick={signUpClick}>Sign up</Button>
        </Stack>
    );
}