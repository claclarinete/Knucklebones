import { createContext } from 'react';
import { createSocket } from './socket';

/** Conexão única, compartilhada entre as telas. Os testes injetam um substituto. */
export const SocketContext = createContext(createSocket());
