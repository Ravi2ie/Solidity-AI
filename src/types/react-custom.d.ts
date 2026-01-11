import 'react';

declare global {
  namespace React {
    interface InputHTMLAttributes<T> {
      webkitdirectory?: string | boolean;
      mozdirectory?: string | boolean;
      nwdirectory?: string | boolean;
    }
  }
}
