import SwaggerUI from 'swagger-ui-react'
import "swagger-ui-react/swagger-ui.css"
//import "swagger-ui-themes/themes/3.x/theme-feeling-blue.css"
import { api_getSwaggerDoc } from '../api';
import { useState } from 'react';

export default function SwaggerDocs() {

    let [yaml, setYaml] = useState('');

    api_getSwaggerDoc().then(response => {
        if (response.status == 200) {
            response.text().then(text => {
                setYaml(text);
            })
        }
    });

    return (
        <div style={{backgroundColor: "white"}}>
            {yaml != null && <SwaggerUI spec={yaml} />}
            {/* <SwaggerUI url="https://petstore.swagger.io/v2/swagger.json" /> */}
        </div>
    );
}