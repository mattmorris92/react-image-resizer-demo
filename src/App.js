import React, { useEffect, useState } from 'react';

import Alert from 'react-bootstrap/Alert'
import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'
import CardDeck from 'react-bootstrap/CardDeck'
import CardGroup from 'react-bootstrap/CardGroup'
import Container from 'react-bootstrap/Container'
import Form from 'react-bootstrap/Form'

import Resizer from 'react-image-file-resizer';

import 'bootstrap/dist/css/bootstrap.min.css'

function dataURItoFile(dataURI) {
    var byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0)
        byteString = atob(dataURI.split(',')[1]);
    else
        byteString = unescape(dataURI.split(',')[1]);

    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    var blob = new Blob([ia], {type:mimeString});

    return new File([blob], "file", { type: blob.type });
}

function App() {
  const [description, setDescription] = useState();
  const [file, setFile] = useState();
  const [inspections, setInspections] = useState([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [validationError, setValidationError] = useState(false);

  useEffect(() => {
    if (inspections.length === 0) {
      getInspections();
    }
  });

  const fileChangedHandler = (event) => {
      var fileInput = false
      if(event.target.files[0]) {
          fileInput = true;
      }
      if(fileInput) {
          Resizer.imageFileResizer(
              event.target.files[0],
              300,
              300,
              'JPEG',
              50,
              0,
              uri => {
                var file = dataURItoFile(uri)
                setFile(file)
              },
              'base64'
          );
      }
  }

  const upload = (e) => {
    e.preventDefault();

    if (description && file) {
      setValidationError(false);

      var formData = new FormData();
      formData.append(`file`, file);
      formData.append('description', description);

      fetch('https://api.missionmoon.io/inspection/upload', {
        method: 'POST',
        body: formData,
      }, {mode: 'cors'})
        .then(response => response.json())
        .then(success => {
          getInspections();
          setUploadSuccess(true);
          setHasSubmitted(true);
          setDescription("");
          setFile("");
        })
        .catch(error => {
            setUploadSuccess(false);
            setHasSubmitted(true);
          }
        )

      return
    }

    setValidationError(true);
  }

  const getInspections = () => {
    fetch('https://api.missionmoon.io/inspection/all', {
      method: 'GET'
    }, {mode: 'cors'})
      .then(response => {return response.json()})
      .then(json => { setInspections(json.inspections); })
      .then(success => {
      })
      .catch(error => console.log(error)
    );
  }

  return (
    <Container fluid style={{padding: '20px'}}>
      { hasSubmitted ?
      <Alert variant={uploadSuccess ? `success` : `danger`} style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between'}}>
        Inspection creation was {uploadSuccess ? `successful` : `unsuccessful`}.
        <Button variant={uploadSuccess ? `outline-success` : `outline-danger`} onClick={() => setHasSubmitted(false)}>
          Close
        </Button>
      </Alert> : <></>
      }
      <Card>
        <Card.Body>
          <h3>New Inspection</h3>
          { validationError ? <h5 style={{ color: 'red' }}>Description and a file are both required</h5> : <></> }
          <Form>
            <Form.Group>
              <Form.Label>Description</Form.Label>
              <Form.Control
              as="textarea"
              rows="3"
              value={description}
              placeholder="Details about the inspection"
              onChange={(event) => setDescription(event.target.value)}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Image</Form.Label>
              <Form.File
                id="custom-file"
                label="Select Image"
                onChange={(event) => fileChangedHandler(event)}
                custom
              />
            </Form.Group>
            <Form.Group>
              <Button onClick={(event) => upload(event)}>Submit</Button>
            </Form.Group>
          </Form>
        </Card.Body>
      </Card>
      <Container fluid style={{marginTop: '20px'}}>
        <h3>Inspections</h3>
        { inspections.length ?
        <CardDeck>
          { inspections.map((inspection) => (
          <CardGroup style={{ marginTop: '20px' }}>
            <Card key={inspection._id}>
              <Card.Img variant="top" src={inspection.path} />
              <Card.Body>
                <Card.Title>ID: {inspection._id}</Card.Title>
                <Card.Text>{inspection.description}</Card.Text>
              </Card.Body>
              <Card.Footer>
                <small className="text-muted">Last updated: {new Date(inspection.created).toLocaleDateString("en-US")}</small>
              </Card.Footer>
            </Card>
          </CardGroup>
          ))}
        </CardDeck>
        : <>No Inspections</>}
      </Container>
    </Container>
  );
}

export default App;
