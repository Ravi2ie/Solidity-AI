import { Helmet } from 'react-helmet-async';
import IDELayout from '@/components/ide/IDELayout';

const Index = () => {
  return (
    <>
      <Helmet>
        <title>SolIDE - AI-Powered Solidity Code Editor</title>
        <meta name="description" content="A powerful VS Code-style Solidity IDE with AI-powered NatSpec comment generation. Write, edit, and document smart contracts with ease." />
      </Helmet>
      <IDELayout />
    </>
  );
};

export default Index;
