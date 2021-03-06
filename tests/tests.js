(() => {
    'use strict';

    var Wsdlrdr = require('../src/index.js');

    const wsdlUrls = [{
        host: 'soaptest.parasoft.com',
        wsdl: '/calculator.wsdl'
    }, {
        host: 'webservices.oorsprong.org',
        wsdl: '/websamples.countryinfo/CountryInfoService.wso?WSDL'
    }, {
        host: 'webservices.daehosting.com',
        wsdl: '/services/isbnservice.wso?WSDL'
    }, {
        host: 'www.dataaccess.com',
        wsdl: '/webservicesserver/numberconversion.wso?WSDL'
    }, {
        host: 'webservices.optimalpayments.com',
        wsdl: '/ilsWS/IlsService/v1?wsdl'
    }];

    const wsdlOpts = {};
    const wsdlFunctions = [];

    var test = require('tape');

    test('notExistsingWsdlUrl', async (t) => {
        try {
            await Wsdlrdr.getAllFunctions({
                host: 'www.notexist.com',
                wsdl: '/wsdl'
            });

            t.end('has response');
        } catch (err) {
            t.ok(err, 'wsdl not exists');
            t.end();
        }
    });

    test('getNamespaces', async (t) => {
        try {
            for (let wsdlParams of wsdlUrls) {
                t.comment(`=> ${wsdlParams.host}`);
                let data = await Wsdlrdr.getNamespaces(wsdlParams, wsdlOpts[wsdlParams.host]);
                t.ok(data.length !== 0, `${wsdlParams.host} has ${data.length} namespaces`);
            }
            t.end();
        } catch (err) {
            console.trace(err);
            t.end(err);
        }
    });

    test('getAllFunctions', async (t) => {
        try {
            for (let wsdlParams of wsdlUrls) {
                t.comment(`=> ${wsdlParams.host}`);
                let data = await Wsdlrdr.getAllFunctions(wsdlParams, wsdlOpts[wsdlParams.host]);
                t.ok(data.length !== 0, `${wsdlParams.host} has ${data.length} functions`);
                // save found functions
                wsdlFunctions[wsdlParams.host] = data;
            }
            t.end();
        } catch (err) {
            console.trace(err);
            t.end(err);
        }
    });

    test('getMethodParamsByName', async (t) => {
        try {
            for (let wsdlParams of wsdlUrls) {
                for (let methodName of wsdlFunctions[wsdlParams.host]) {
                    let methodParams = await Wsdlrdr.getMethodParamsByName(methodName, wsdlParams, wsdlOpts[wsdlParams.host]);
                    t.ok(methodParams, `could get params from method "${methodName}"`);
                    t.ok(methodParams.response, `response available`);
                    t.ok(methodParams.response.find((responseItem) => responseItem.name === 'parameters'), 'got response parameters');
                    t.ok(methodParams.request, `request available`);
                    t.ok(methodParams.request.find((requestItem) => requestItem.name === 'parameters'), 'got request parameters');
                }
            }

            t.end();
        } catch (err) {
            console.trace(err);
            t.end(err);
        }
    });

    test('getMethodParamsByName.givenMethodNotExists', async (t) => {
        try {
            var wsdlParams = wsdlUrls[0];
            if (!wsdlParams) {
                t.end('no wsdlParams');
            }

            await Wsdlrdr.getMethodParamsByName('notAvailableMethodName', wsdlParams);
            t.end('has found method');
        } catch (err) {
            t.ok(err, 'not found method');
            t.end();
        }
    });

    test('getXmlDataAsJson', (t) => {
        t.plan(2);
        var responseXml = `<?xml version="1.0" encoding="UTF-8"?>
            <SOAP-ENV:Envelope
                xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/"
                xmlns:wsdl="http://schemas.xmlsoap.org/"
                xmlns:xsd="http://www.w3.org/2001/"
                xmlns:tns="http://predic8.com/wsdl/"
                xmlns:soap="http://schemas.xmlsoap.org/wsdl/"
            >
            <SOAP-ENV:Body>
                <tns:testResponseItem1>123</tns:testResponseItem1>
                <tns:testResponseItem2>123</tns:testResponseItem2>
            </SOAP-ENV:Body>
        </SOAP-ENV:Envelope>`;

        var dataAsJson = Wsdlrdr.getXmlDataAsJson(responseXml);
        dataAsJson.forEach((dataItem) => {
            if (dataItem.testResponseItem1) t.pass('testResponseItem1 is available');
            if (dataItem.testResponseItem2) t.pass('testResponseItem2 is available');
        });
    });

    test('getXmlDataAsJson.noBody', (t) => {
        var xml = `<?xml version="1.0" encoding="utf-16"?>
        <CurrentWeather>
            <Location>Leipzig-Schkeuditz, Germany (EDDP) 51-25N 012-14E 149M</Location>
            <Time>Oct 07, 2015 - 06:50 AM EDT / 2015.10.07 1050 UTC</Time>
            <Wind> from the SE (140 degrees) at 6 MPH (5 KT):0</Wind>
            <Visibility> greater than 7 mile(s):0</Visibility>
            <SkyConditions> mostly cloudy</SkyConditions>
            <Temperature> 62 F (17 C)</Temperature>
            <DewPoint> 62 F (17 C)</DewPoint>
            <RelativeHumidity> 100%</RelativeHumidity>
            <Pressure> 29.85 in. Hg (1011 hPa)</Pressure>
            <Status>Success</Status>
        </CurrentWeather>`;

        var dataAsJson = Wsdlrdr.getXmlDataAsJson(xml);

        t.ok(dataAsJson.CurrentWeather.length !== 0, 'data available');
        t.end();
    });
})();
