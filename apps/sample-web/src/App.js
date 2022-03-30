import './App.css';

import { Authenticator, Text } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

import { Container, Row, Col, Navbar, Nav, NavDropdown, Form, Card, CardGroup, Button } from 'react-bootstrap';

function joinMeeting(meetingTitle, username) {
  const baseUrl = process.env.REACT_APP_CHIME_SDK_MEETING_URL;
  const token = process.env.REACT_APP_CHIME_SDK_MEETING_TOKEN;
  const url = `${baseUrl}/?token=${token}&meetingid=${meetingTitle}&username=${username}`;
  window.open(url, '_blank');
}

function App() {
  return (
    <Authenticator variation="default">
      {({ signOut, user }) => (
        <Container>
          <Navbar bg="light" expand="lg" className='m-2'>
            <Container>
              <Navbar.Brand href="#home">Sample Website for Chime SDK</Navbar.Brand>
              <Navbar.Toggle aria-controls="basic-navbar-nav" />
              <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
              <Nav.Item>
                <Nav.Link eventKey="disabled" disabled>
                  Hello {user.username}!
                </Nav.Link>
              </Nav.Item>
                <Button variant="warning" onClick={signOut}>Sign Out</Button>
              </Navbar.Collapse>
            </Container>
          </Navbar>
          
          <Row className='p-2'>
            <Container>
              <CardGroup className='mb-2'>
                <Card style={{ width: '18rem' }}>
                  <Card.Body>
                    <Card.Title>Cloud Essentials Meeting Room</Card.Title>
                    <Card.Text>Learn cloud fundamentals and best practices.</Card.Text>
                    <Button variant="primary" onClick={() => joinMeeting('cloud-essentials', user.username)}>Join Meeting</Button>
                  </Card.Body>
                </Card>
              </CardGroup>
              <CardGroup className='mb-2'>
                <Card style={{ width: '18rem' }}>
                  <Card.Body>
                    <Card.Title>Architecting Meeting Room</Card.Title>
                    <Card.Text>Learn to design highly available systems.</Card.Text>
                    <Button variant="primary" onClick={() => joinMeeting('architecting', user.username)}>Join Meeting</Button>
                  </Card.Body>
                </Card>
              </CardGroup>
              <CardGroup className='mb-2'>
                <Card style={{ width: '18rem' }}>
                  <Card.Body>
                    <Card.Title>Machine Learning Meeting Room</Card.Title>
                    <Card.Text>Learn to integrate machine learning (ML) and artificial intelligence (AI) into tools and applications.</Card.Text>
                    <Button variant="primary" onClick={() => joinMeeting('machine-learning', user.username)}>Join Meeting</Button>
                  </Card.Body>
                </Card>
              </CardGroup>  
            </Container>
          </Row>
        </Container>
      )}
    </Authenticator>
  );
}

export default App;
