import zora from 'zora';
import moveRight from './moveRight';
import moveLeft from './moveLeft';
import moveUp from './moveUp';
import moveDown from './moveDown';

zora()
  .test(moveRight)
  .test(moveLeft)
  .test(moveUp)
  .test(moveDown)
  .run();