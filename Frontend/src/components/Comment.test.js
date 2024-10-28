import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react';

import { CommentReview } from './CommentReview';
import CommentForm from './CommentForm';

//the test case of Comment form component
test('CommentForm updates state and triggers submit correctly', () => {
  const onSubmitMock = jest.fn();
  const { getByPlaceholderText } = render(<CommentForm onSubmit={onSubmitMock} />);

  const input = getByPlaceholderText('Enter comment');
  fireEvent.change(input, { target: { value: 'Test comment' } });
  fireEvent.blur(input);
  expect(input.value).toBe('Test comment');
  expect(onSubmitMock).toHaveBeenCalledWith({ comment: 'Test comment' });
});


//the test case of comment review component

jest.mock('../api/api', () => ({
  get: jest.fn(),
}));

describe('CommentReview component', () => {
  const state = {
    date: '2023-12-08',
    task: ['task1', 'task2'],
    shift: ['shift1', 'shift2'],
    occurrence: 'occurrence1',
  };

  it('renders without errors and fetches comments', async () => {
    const comments = [
      { id: 1, text: 'First comment', created_by: 'User1' },
      { id: 2, text: 'Second comment', created_by: 'User2' },
    ];

    // Mock the API response
    const mockApiGet = jest.fn().mockResolvedValue({ status: 200, data: comments });
    require('../api/api').get = mockApiGet;

    const { getByText } = render(<CommentReview state={state} />);

    // Assert loading state or initial rendering
    expect(getByText('Previous Comments')).toBeInTheDocument();

    // Wait for the component to fetch comments
    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalledWith(`/api/comment/add/${state.date}/${state.task[1]}/${state.shift[1]}/${state.occurrence}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      });

      // Assert that the comments are rendered
      expect(getByText('First comment')).toBeInTheDocument();
      expect(getByText('Second comment')).toBeInTheDocument();
      expect(getByText('User1')).toBeInTheDocument();
      expect(getByText('User2')).toBeInTheDocument();
    });
  });

  it('handles error if comments fetching fails', async () => {
    const errorMessage = 'Failed to fetch comments';
    const mockApiGet = jest.fn().mockRejectedValue(new Error(errorMessage));
    require('../api/api').get = mockApiGet;

    const { getByText } = render(<CommentReview state={state} />);

    // Wait for error message to be logged
  
  });
});
