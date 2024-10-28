import React from 'react';
import { render } from '@testing-library/react'; 
import BackgroundHeader from './BackgroundHeader';
import { BrowserRouter } from 'react-router-dom';
import BackgroundPattern from './BackgroundPattern';


// write the test code of BackgroundHeader component 

describe('BackgroundHeader component', () => {
  it('renders with correct props', () => {
    const props = {
      heading: 'Test Heading',
      subheading: 'Test Subheading',
    };

    const { getByText} = render(<BackgroundHeader {...props} />);

    const headingElement = getByText(props.heading);
    const subheadingElement = getByText(props.subheading);

    expect(headingElement).toBeInTheDocument();
    expect(subheadingElement).toBeInTheDocument();
  });

  // Add more test cases as needed
});

// write the test code of backgroundpattern component 


describe('BackgroundPattern component', () => {
    it('renders without errors', () => {
      const { getByText } = render(
        <BrowserRouter>
          <BackgroundPattern />
        </BrowserRouter>
      );
  
      const linkElement = getByText('SWACHH STATIONS');
      expect(linkElement).toBeInTheDocument();
    });
  });