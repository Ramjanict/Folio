import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Folio API')
    .setDescription(
      'Book management API for readers, authors, and admins. ' +
        'Public catalog routes need no token. Protected routes use a Bearer access token from POST /auth/login. ' +
        'Authors submit drafts. Admins publish books, manage categories and users, and move loans through their statuses.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Access token returned by POST /auth/login or POST /auth/refresh.',
      },
      'access-token',
    )
    .addTag('Health', 'Process and database status')
    .addTag('Auth', 'Registration, login, refresh, logout, and password reset')
    .addTag('Books', 'Public catalog, author studio, and admin moderation')
    .addTag('Categories', 'Public taxonomy and admin category management')
    .addTag('Borrow', 'Loan requests, returns, and the admin loan desk')
    .addTag('Reviews', 'Ratings and comments on published books')
    .addTag('Favorites', 'A signed-in reader’s saved books')
    .addTag('Users', 'Profile updates and admin account management')
    .addTag('Authors', 'Author profiles and public author pages')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });
}
