FROM flameshikari/outline-ru:1.6.1

USER root

COPY --chown=nodejs:nodejs patches/DocumentConverter.js /opt/outline/build/server/utils/DocumentConverter.js
COPY --chown=nodejs:nodejs patches/index.js /opt/outline/build/server/routes/api/index.js
COPY --chown=nodejs:nodejs patches/ai.js /opt/outline/build/server/routes/api/ai.js
COPY --chown=nodejs:nodejs patches/app.js /opt/outline/build/server/routes/app.js
COPY --chown=nodejs:nodejs patches/Attachment.js /opt/outline/build/shared/editor/nodes/Attachment.js
COPY --chown=nodejs:nodejs patches/AuthenticationHelper.js /opt/outline/build/shared/helpers/AuthenticationHelper.js
COPY --chown=nodejs:nodejs patches/authenticated*.js /opt/outline/build/app/assets/
COPY --chown=nodejs:nodejs patches/index.BwhgC5ZG.js /opt/outline/build/app/assets/
COPY --chown=nodejs:nodejs patches/index.codexfix*.js /opt/outline/build/app/assets/

USER nodejs
