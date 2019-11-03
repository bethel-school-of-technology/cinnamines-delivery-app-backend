
install library:
<npm install --save jsonwebtoken>
<npm install --save cookie-parser>
<npm install> is all that is needed if the package.json from this project used

create:
services/jwtAuth.js file

edit server.js:
import 'authService' from ./services.jwtAuth
create login route

