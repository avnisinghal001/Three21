'use client'
import React, { useCallback } from 'react';

// 👇 Child component (optional, for memoization example)
const Child = React.memo(({ onClick }) => {
  console.log('Child rendered');
  return <button onClick={onClick}>Click Me</button>;
});

// 👇 Parent component using useCallback
const Parent = () => {
  const handleClick = useCallback(() => {
    console.log("Clicked!");
  }, []); // Memoized function

  return <Child onClick={handleClick} />;
};

// 👇 Page component rendering the Parent
const Page = () => {
  return (
    <div>
      <h2>useCallback Demo</h2>
      <Parent />
    </div>
  );
};

export default Page;
