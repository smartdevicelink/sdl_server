CREATE TYPE edit_status AS ENUM ('STAGING', 'PRODUCTION');
CREATE TYPE approval_status AS ENUM ('PENDING', 'ACCEPTED', 'DENIED');
CREATE TYPE application_platform AS ENUM ('ANDROID', 'IOS');
CREATE TYPE application_status AS ENUM ('DEVELOPMENT', 'REVIEW', 'PRODUCTION');

CREATE TABLE module_config (
    "id" SERIAL NOT NULL,
    "status" edit_status NOT NULL DEFAULT 'STAGING',
    "preloaded_pt" BOOLEAN NOT NULL DEFAULT true,
    "exchange_after_x_ignition_cycles" INT NOT NULL DEFAULT 100,
    "exchange_after_x_kilometers" INT NOT NULL DEFAULT 180,
    "exchange_after_x_days" INT NOT NULL DEFAULT 30,
    "timeout_after_x_seconds" INT NOT NULL DEFAULT 60,
    "endpoint_0x07" TEXT NOT NULL,
    "endpoint_0x04" TEXT NOT NULL,
    "query_apps_url" TEXT NOT NULL,
    "lock_screen_default_url" TEXT NOT NULL,
    "emergency_notifications" INT NOT NULL DEFAULT 60,
    "navigation_notifications" INT NOT NULL DEFAULT 15,
    "voicecom_notifications" INT NOT NULL DEFAULT 20,
    "communication_notifications" INT NOT NULL DEFAULT 6,
    "normal_notifications" INT NOT NULL DEFAULT 4,
    "none_notifications" INT NOT NULL DEFAULT 0,
    "created_ts" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    "updated_ts" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
)
WITH ( OIDS = FALSE );

CREATE TABLE module_config_retry_seconds (
    "id" SERIAL REFERENCES module_config (id) ON UPDATE CASCADE ON DELETE CASCADE,
    "seconds" INT NOT NULL DEFAULT 1,
    PRIMARY KEY (id, seconds)
)
WITH ( OIDS = FALSE );

CREATE TABLE languages (
    "id" CHAR(5) NOT NULL,
    PRIMARY KEY (id)
)
WITH ( OIDS = FALSE );

CREATE TABLE message_text (
	"id" SERIAL NOT NULL,
    "language_id" CHAR(5) REFERENCES languages (id) ON UPDATE CASCADE ON DELETE CASCADE,
    "message_category" TEXT NOT NULL,
    "tts" TEXT,
    "line1" TEXT,
    "line2" TEXT,
    "text_body" TEXT,
    "label" TEXT,
    "status" edit_status NOT NULL DEFAULT 'STAGING',
    "created_ts" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    "updated_ts" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
)
WITH ( OIDS = FALSE );

CREATE TABLE function_group_info (
	"id" SERIAL NOT NULL,
    "property_name" TEXT NOT NULL,
    "user_consent_prompt" TEXT,
    "status" edit_status NOT NULL DEFAULT 'STAGING',
    "created_ts" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    "updated_ts" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_pre_data_consent" BOOLEAN NOT NULL DEFAULT false,
    "is_device" BOOLEAN NOT NULL DEFAULT false,
    PRIMARY KEY (id)
)
WITH ( OIDS = FALSE );

CREATE TABLE rpc_names (
	"id" SERIAL NOT NULL,
    "rpc_name" TEXT NOT NULL,
    PRIMARY KEY (id)
)
WITH ( OIDS = FALSE );

CREATE TABLE vehicle_data (
	"id" SERIAL NOT NULL,
    "component_name" TEXT NOT NULL,
    PRIMARY KEY (id)
)
WITH ( OIDS = FALSE );

CREATE TABLE rpc_permission (
	"function_group_id" SERIAL REFERENCES function_group_info (id) ON UPDATE CASCADE ON DELETE CASCADE,
	"rpc_id" SERIAL REFERENCES rpc_names (id) ON UPDATE CASCADE ON DELETE CASCADE,
    PRIMARY KEY (function_group_id, rpc_id)
)
WITH ( OIDS = FALSE );

CREATE TABLE rpc_vehicle_parameters (
	"function_group_id" SERIAL REFERENCES function_group_info (id) ON UPDATE CASCADE ON DELETE CASCADE,
	"rpc_id" SERIAL REFERENCES rpc_names (id) ON UPDATE CASCADE ON DELETE CASCADE,
	"vehicle_id" SERIAL REFERENCES vehicle_data (id) ON UPDATE CASCADE ON DELETE CASCADE,
    PRIMARY KEY (function_group_id, rpc_id, vehicle_id)
)
WITH ( OIDS = FALSE );

CREATE TABLE changelog (
	"status" edit_status NOT NULL DEFAULT 'STAGING',
	"timestamp" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    PRIMARY KEY (status, timestamp)
)
WITH ( OIDS = FALSE );



CREATE TABLE vendors (
	"id" SERIAL NOT NULL,
    "vendor_name" TEXT NOT NULL,
    "vendor_email" TEXT NOT NULL,
    PRIMARY KEY (id)
)
WITH ( OIDS = FALSE );

CREATE TABLE categories (
	"id" INT NOT NULL,
    "display_name" TEXT NOT NULL,
    PRIMARY KEY (id)
)
WITH ( OIDS = FALSE );

CREATE TABLE countries (
    "iso" CHAR(2) NOT NULL,
    "name" TEXT NOT NULL,
    PRIMARY KEY (iso)
)
WITH ( OIDS = FALSE );

CREATE TABLE hmi_levels (
    "id" TEXT NOT NULL,
    PRIMARY KEY (id)
)
WITH ( OIDS = FALSE );

CREATE TABLE app_info (
	"id" SERIAL NOT NULL,
	"app_uuid" VARCHAR(36) NOT NULL,
	"name" TEXT NOT NULL,
	"vendor_id" INT REFERENCES vendors (id) ON UPDATE CASCADE ON DELETE CASCADE,
	"platform" application_platform NOT NULL,
	"platform_app_id" TEXT,
  	"status" application_status NOT NULL,
  	"can_background_alert" BOOLEAN NOT NULL,
  	"can_steal_focus" BOOLEAN NOT NULL,
	"default_hmi_level" TEXT NOT NULL REFERENCES hmi_levels (id) ON UPDATE CASCADE ON DELETE CASCADE,
	"tech_email" TEXT,
	"tech_phone" TEXT,
    "created_ts" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    "updated_ts" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
	"category_id" INT REFERENCES categories (id) ON UPDATE CASCADE ON DELETE CASCADE,
	"approval_status" approval_status NOT NULL DEFAULT 'PENDING',
    PRIMARY KEY (id)
)
WITH ( OIDS = FALSE );

CREATE TABLE app_countries (
    "app_id" SERIAL REFERENCES app_info (id) ON UPDATE CASCADE ON DELETE CASCADE,
	"country_iso" CHAR(2) REFERENCES countries (iso) ON UPDATE CASCADE ON DELETE CASCADE,
    PRIMARY KEY (app_id, country_iso)
)
WITH ( OIDS = FALSE );

CREATE TABLE display_names (
    "app_id" SERIAL REFERENCES app_info (id) ON UPDATE CASCADE ON DELETE CASCADE,
	"display_text" VARCHAR(100) NOT NULL,
    PRIMARY KEY (app_id, display_text)
)
WITH ( OIDS = FALSE );

CREATE TABLE app_vehicle_permissions (
    "app_id" SERIAL REFERENCES app_info (id) ON UPDATE CASCADE ON DELETE CASCADE,
	"vehicle_id" SERIAL REFERENCES vehicle_data (id) ON UPDATE CASCADE ON DELETE CASCADE,
    PRIMARY KEY (app_id, vehicle_id)
)
WITH ( OIDS = FALSE );

CREATE TABLE app_rpc_permissions (
    "app_id" SERIAL REFERENCES app_info (id) ON UPDATE CASCADE ON DELETE CASCADE,
    "rpc_id" SERIAL REFERENCES rpc_names (id) ON UPDATE CASCADE ON DELETE CASCADE,
    PRIMARY KEY (app_id, rpc_id)
)
WITH ( OIDS = FALSE );


INSERT INTO module_config ("preloaded_pt", "exchange_after_x_ignition_cycles", "exchange_after_x_kilometers", "exchange_after_x_days", "timeout_after_x_seconds", "endpoint_0x07", "endpoint_0x04", "query_apps_url", "lock_screen_default_url", "emergency_notifications", "navigation_notifications", "voicecom_notifications", "communication_notifications", "normal_notifications", "none_notifications") VALUES
(true, 100, 1800, 30, 60, 'http://localhost:3000/api/1/policies/proprietary', 'http://localhost:3000/api/1/softwareUpdate', 'http://localhost:3000/api/1/queryApps', 'https://i.imgur.com/TgkvOIZ.png', 60, 15, 20, 6, 4, 0);


INSERT INTO "module_config_retry_seconds" ("id", "seconds")
VALUES(1, 1),(1, 5),(1, 25),(1, 125),(1, 625);


INSERT INTO "languages" ("id")
VALUES
('de-de'),
('en-au'),
('en-gb'),
('en-ie'),
('en-us'),
('es-en'),
('es-es'),
('es-mx'),
('fr-ca'),
('fr-fr'),
('it-it'),
('nl-nl'),
('pl-pl'),
('pt-br'),
('pt-pt'),
('ru-ru'),
('sv-se'),
('tr-tr'),
('zh-cn'),
('zh-tw');

INSERT INTO "message_text" ("label", "language_id", "line1", "line2", "message_category","text_body", "tts")
VALUES
(null, 'de-de', 'Zugriffsanfrage(n)', 'erlauben?', 'AppPermissions', null, '%appName% benötigt die folgenden Fahrzeuginformationen und Zugriffsberechtigungen: %functionalGroupLabels%. Wenn Sie Ja drücken, erklären Sie sich damit einverstanden, dass %vehicleMake% nicht für Schäden oder Verletzungen der Privatsphäre haftet, die im Zusammenhang mit der Nutzung Ihrer Benutzerdaten durch %appName% entstehen. Mit Ja stimmen Sie zu; mit Nein lehnen Sie ab.'),
(null, 'en-au', 'Grant requested', 'permission(s)?', 'AppPermissions', null, '%appName% is requesting the use of the following vehicle information and permissions: %functionalGroupLabels%. If you press Yes, you agree that %vehicleMake% will not be liable for any damages or loss of privacy related to %appName%''s use of your data. Please press Yes to allow or No to deny.'),
(null, 'en-gb', 'Grant requested', 'permission(s)?', 'AppPermissions', '%appName% is requesting the use of the following vehicle information and permissions: %functionalGroupLabels%. If you press yes, you agree that %vehicleMake% will not be liable for any damages or loss of privacy related to %appName%`s use of your data. You can change these permissions and hear detailed descriptions in the mobile apps settings menu.', '%appName% is requesting the use of the following vehicle information and permissions: %functionalGroupLabels%. If you press Yes, you agree that %vehicleMake% will not be liable for any damages or loss of privacy related to %appName%`s use of your data. Please press Yes to allow or No to deny.'),
(null, 'en-ie', 'Grant requested', 'permission(s)?', 'AppPermissions', null, '%appName% is requesting the use of the following vehicle information and permissions: %functionalGroupLabels%. If you press Yes, you agree that %vehicleMake% will not be liable for any damages or loss of privacy related to %appName%''s use of your data. Please press Yes to allow or No to deny.'),
(null, 'en-us', 'Grant Requested', 'Permission(s)?', 'AppPermissions', '%appName% is requesting the use of the following vehicle information and permissions: %functionalGroupLabels%.

If you press yes, you agree that %vehicleMake% will not be liable for any damages or loss of privacy related to %appName%’s use of your data. You can change these permissions and hear detailed descriptions in the mobile apps settings menu.', '%appName% is requesting the use of the following vehicle information and permissions: %functionalGroupLabels%. If you press yes, you agree that %vehicleMake% will not be liable for any damages or loss of privacy related to %appName%’s use of your data. Please press yes to allow or no to deny.'),
(null, 'es-en', '¿Otorgar permiso(s)', 'solicitado(s)?', 'AppPermissions', '%appName% solicita el uso de la siguiente información y permisos del vehículo: %functionalGroupLabels%. Si presiona Sí, acepta que %vehicleMake% no se hará responsable por los daños o pérdidas de privacidad relacionados con el uso que %appName% haga de sus datos. Presione Sí para permitir y No para denegar.

 Puede cambiar estos permisos y consultar descripciones detalladas en el menú de configuración de las aplicaciones móviles.', '%appName% solicita el uso de la siguiente información y permisos del vehículo: %functionalGroupLabels%. Si presiona Sí, acepta que %vehicleMake% no se hará responsable por los daños o pérdidas de privacidad relacionados con el uso que %appName% haga de sus datos. Presione Sí para permitir y No para denegar.'),
(null, 'es-es', '¿Conceder permisos', 'solicitados?', 'AppPermissions', null, '%appName% está solicitando el uso de los siguientes permisos e información del vehículo: %functionalGroupLabels%. Si pulsa sí, acepta que %vehicleMake% no será responsable de los daños o la pérdida de privacidad relacionados con el uso de sus datos por parte de %appName%. Pulse sí para permitir o no para denegar.'),
(null, 'es-mx', '¿Otorgar permiso(s)', 'solicitado(s)?', 'AppPermissions', '%appName% solicita el uso de la siguiente información y permisos del vehículo: %functionalGroupLabels%.

Si presiona Sí, acepta que %vehicleMake% no se hará responsable por los daños o pérdidas de privacidad relacionados con el uso que %appName% haga de sus datos. Presione Sí para permitir y No para denegar. Puede cambiar estos permisos y consultar descripciones detalladas en el menú de configuración de las aplicaciones móviles.', '%appName% solicita el uso de la siguiente información y permisos del vehículo: %functionalGroupLabels%. Si presiona Sí, acepta que %vehicleMake% no se hará responsable por los daños o pérdidas de privacidad relacionados con el uso que %appName% haga de sus datos. Presione Sí para permitir y No para denegar.'),
(null, 'fr-ca', 'Accorder permission(s)', 'demandée(s)', 'AppPermissions', '%appName% demande d’utiliser les informations du véhicule et les permissions suivantes : %functionalGroupLabels%. Si vous appuyez sur Oui, vous acceptez que %vehicleMake% ne sera pas responsable des dommages ou des pertes de confidentialité reliées à l’utilisation de vos données par %appName%. Vous pouvez modifier ces permissions et entendre les descriptions détaillées dans le menu des réglages des applications mobiles.', '%appName% demande d’utiliser les informations du véhicule et les permissions suivantes : %functionalGroupLabels%. Si vous appuyez sur Oui, vous acceptez que %vehicleMake% ne sera pas responsable des dommages ou des pertes de confidentialité reliées à l’utilisation de vos données par %appName%. Veuillez appuyer sur Oui pour autoriser ou sur Non pour refuser.'),
(null, 'fr-fr', 'Accorder permission(s)', 'demandée(s)', 'AppPermissions', null, '%appName% demande d’utiliser les informations du véhicule et les permissions suivantes : %functionalGroupLabels%. Si vous appuyez sur Oui, vous acceptez que %vehicleMake% ne sera pas responsable des dommages ou des pertes de confidentialité reliées à l’utilisation de vos données par %appName%. Veuillez appuyer sur Oui pour autoriser ou sur Non pour refuser.'),
(null, 'it-it', 'Concedi autorizzaz.', 'richiesta(e)?', 'AppPermissions', null, '%appName% richiede l''uso delle seguenti informazioni e autorizzazioni sul veicolo: %functionalGroupLabels%. Se si preme Sì, si acconsente che %vehicleMake% non sarà responsabile per danni o perdita di privacy in relazione all''impiego dei dati da parte di %appName%. Premere Sì per consentire e No per negare.'),
(null, 'nl-nl', 'Aangevraagde', 'permissie(s) verlenen?', 'AppPermissions', null, '%appName% vraagt gebruikmaking van de volgende voertuiginformatie en toestemmingen aan: %functionalGroupLabels%. Als u op Ja drukt, gaat u ermee akkoord dat %vehicleMake% in geen geval aansprakelijk gesteld kan worden voor schade of verlies van privacy als gevolg van het feit dat %appName% gebruik maakt van uw gegevens. Druk op Ja om dit toe te staan of Nee om te weigeren.'),
(null, 'pl-pl', 'Udzielić żądanych', 'pozwoleń?', 'AppPermissions', null, '%appName% wymaga następujących informacji o pojeździe oraz pozwoleń: %functionalGroupLabels%. Naciśnięcie TAK oznacza zgodę na fakt, iż %vehicleMake% nie będzie ponosić odpowiedzialności za szkody ani utratę prywatności w związku z wykorzystaniem przez %appName% danych, należących do użytkownika. Naciśnij TAK w celu udzielenia zgody lub NIE w celu odrzucenia żądania.'),
(null, 'pt-br', 'Conceder permissão', 'solicitada?', 'AppPermissions', null, '%appName% está solicitando o uso das seguintes informações e permissões do veículo: %functionalGroupLabels%. Se pressionar sim, você concorda que a %vehicleMake% não será responsável por danos ou perdas de privacidade relacionados ao uso dos seus dados por %appName%. Pressione sim para permitir ou não para negar.'),
(null, 'pt-pt', 'Conceder permiss.', 'solicitada(s)?', 'AppPermissions', null, '%appName% está a solicitar a utilização das seguintes informações e permissões do veículo: %functionalGroupLabels%. Se premir “Sim”, concorda que %vehicleMake% não será responsável por quaisquer danos ou perda de privacidade relacionada com a utilização dos seus dados por parte de %appName%. Prima “Sim” para permitir ou “Não” para recusar.'),
(null, 'ru-ru', 'Предост. заправш.', 'разрешения?', 'AppPermissions', null, '%appName% запрашивает следующую информацию об автомобиле и разрешения: %functionalGroupLabels%. Нажатием ""да"", Вы соглашаетесь, что %vehicleMake% не будет нести ответственность за какие-либо убытки или потерю прайвеси, связанные с использованием Ваших данных компанией %appName%. Нажмите ""Да"", если Вы согласны, или ""Нет"" - если не согласны.'),
(null, 'sv-se', 'Vill du ge', 'tillstånd?', 'AppPermissions', null, '%appName% begär att få tillgång till följande fordonsinformation och tillstånd: %functionalGroupLabels%. Om du trycker Ja godkänner du att %vehicleMake% ska hållas skadeslös för alla skador som kan uppstå eller eventuella integritetsintrång som uppstår när %appName% använder dina data. Tryck Ja för att godkänna eller Nej för att neka.'),
(null, 'tr-tr', 'İstenen izinler', 'verilsin mi?', 'AppPermissions', null, '%appName%, şu araç bilgilerini ve izinleri kullanma isteğinde bulunuyor: %functionalGroupLabels%. Evet''e basarsanız, %appName%''in verilerinizi kullanması sonucunda oluşabilecek hasarlardan veya gizlilik kaybından %vehicleMake%''in sorumlu olmayacağını kabul etmiş olacaksınız. Lütfen kabul etmek için Evet''e veya reddetmek için Hayır''a basın.'),
(null, 'zh-cn', '是否允许请求的', '权限？', 'AppPermissions', null, '%appName% 正在请求使用下列车辆信息和权限： %functionalGroupLabels%。如果您按“是”，则表示您同意。 %vehicleMake% 将不会对因 %appName% 使用您的数据而引起的任何损毁或隐私损失负责。 请按“是”允许或按“否”拒绝。'),
(null, 'zh-tw', '允許', '授權請求?', 'AppPermissions', null, '%appName% 正請求使用 %functionalGroupLabels% 的車輛資訊和許可。按「是」，表示您同意，如因 %appName% 使用您的資料導致任何損害或損失，%vehicleMake% 將不負賠償責任。同意請按「是」，拒絕請按「否」。'),
(null, 'de-de', null, null, 'AppPermissionsHelp', null, '%appName% fordert folgende Fahrzeuginformationen und Zugriffsberechtigungen: %functionalGroupLabels%. Im Einstellungsmenü der mobilen Apps können Sie diese Berechtigungen ändern und sich detaillierte Beschreibungen anhören. Mit Ja stimmen Sie zu; mit Nein lehnen Sie ab.'),
(null, 'en-au', null, null, 'AppPermissionsHelp', null, '%appName% is requesting the following vehicle information and permissions: %functionalGroupLabels%. You can change these permissions and hear detailed descriptions in the mobile apps settings menu. Please press Yes to grant permissions or No to deny.'),
(null, 'en-gb', null, null, 'AppPermissionsHelp', null, '%appName% is requesting the following vehicle information and permissions: %functionalGroupLabels%. You can change these permissions and hear detailed descriptions in the mobile apps settings menu. Please press Yes to grant permissions or No to deny.'),
(null, 'en-ie', null, null, 'AppPermissionsHelp', null, '%appName% is requesting the following vehicle information and permissions: %functionalGroupLabels%. You can change these permissions and hear detailed descriptions in the mobile apps settings menu. Please press Yes to grant permissions or No to deny.'),
(null, 'en-us', null, null, 'AppPermissionsHelp', null, '%appName% is requesting the following vehicle information and permissions: %functionalGroupLabels%. You can change these permissions and hear detailed descriptions in the mobile apps settings menu. Please press yes to grant permissions or no to deny.'),
(null, 'es-en', null, null, 'AppPermissionsHelp', null, '%appName% solicita la siguiente información y permisos del vehículo: %functionalGroupLabels%. Puede cambiar estos permisos y consultar descripciones detalladas en el menú de configuración de las aplicaciones móviles. Presione Sí para otorgar permisos y No para denegar.'),
(null, 'es-es', null, null, 'AppPermissionsHelp', null, '%appName% está solicitando los siguientes permisos e información del vehículo: %functionalGroupLabels%. Puede cambiar estos permisos y escuchar descripciones detalladas en el menú de configuración de la aplicación móvil. Pulse sí para conceder el permiso o no para denegarlo.'),
(null, 'es-mx', null, null, 'AppPermissionsHelp', null, '%appName% solicita la siguiente información y permisos del vehículo: %functionalGroupLabels%. Puede cambiar estos permisos y consultar descripciones detalladas en el menú de configuración de las aplicaciones móviles. Presione Sí para otorgar permisos y No para denegar.'),
(null, 'fr-ca', null, null, 'AppPermissionsHelp', null, '%appName% demande d’utiliser les informations du véhicule et les permissions suivantes : %functionalGroupLabels%. Vous pouvez modifier ces permissions et entendre les descriptions détaillées dans le menu des réglages des applications mobiles. Veuillez appuyer sur Oui pour accorder les permissions ou sur Non pour refuser.'),
(null, 'fr-fr', null, null, 'AppPermissionsHelp', null, '%appName% demande d’utiliser les informations du véhicule et les permissions suivantes : %functionalGroupLabels%. Vous pouvez modifier ces permissions et entendre les descriptions détaillées dans le menu des réglages des applications mobiles. Veuillez appuyer sur Oui pour accorder les permissions ou sur Non pour refuser.'),
(null, 'it-it', null, null, 'AppPermissionsHelp', null, '%appName% richiede le seguenti informazioni e autorizzazioni riguardo il veicolo: %functionalGroupLabels%. È possibile modificare tali autorizzazioni e ascoltare descrizioni dettagliate nel menu impostazioni delle app mobili. Premere Sì per concedere le autorizzazioni e No per negarle.'),
(null, 'nl-nl', null, null, 'AppPermissionsHelp', null, '%appName% vraagt gebruikmaking van de volgende voertuiginformatie en toestemmingen aan: %functionalGroupLabels%. U kunt deze toestemmingen wijzigen en gedetailleerde beschrijvingen beluisteren in het instellingenmenu voor mobiele apps. Druk op Ja om permissies te verlenen of op Nee om te weigeren.'),
(null, 'pl-pl', null, null, 'AppPermissionsHelp', null, '%appName% wymaga następujących informacji o pojeździe oraz zezwoleń: %functionalGroupLabels%. W menu ustawień aplikacji mobilnych można zmienić owe zezwolenia i usłyszeć ich szczegółowy opis. Naciśnij TAK, aby wyrazić zgodę lub NIE w celu odrzucenia żądania.'),
(null, 'pt-br', null, null, 'AppPermissionsHelp', null, '%appName% está solicitando as seguintes informações e permissões do veículo: %functionalGroupLabels%. Você pode alterar estas permissões e ouvir descrições detalhadas no menu de configurações de aplicativos móveis. Pressione sim para conceder as permissões ou não para negar.'),
(null, 'pt-pt', null, null, 'AppPermissionsHelp', null, '%appName% está a solicitar as seguintes informações e permissões do veículo: %functionalGroupLabels%. Pode alterar estas permissões e ouvir descrições detalhadas no menu de definições das aplicações móveis. Prima ""Sim"" para permitir ou ""Não"" para recusar.'),
(null, 'ru-ru', null, null, 'AppPermissionsHelp', null, '%appName% запрашивает следующую информацию об автомобиле и разрешения: %functionalGroupLabels%. Вы можете изменить эти разрешения и прослушать подробные их описания в меню настроек мобильного приложения. Нажмите ""да"", чтобы предоставить разрешения, или ""нет"", чтобы не предоставлять.'),
(null, 'sv-se', null, null, 'AppPermissionsHelp', null, '%appName% begär tillgång till följande fordonsinformation och tillstånd: %functionalGroupLabels%. Du kan ändra tillstånden och höra detaljerade beskrivningar i menyn för mobilappsinställningar. Tryck Ja för att ge tillstånd eller Nej för att neka.'),
(null, 'tr-tr', null, null, 'AppPermissionsHelp', null, '%appName%, şu araç bilgilerini ve izinleri istiyor: %functionalGroupLabels%. Bu izinleri değiştirebilir ve mobil uygulamalar ayarlar menüsünden ayrıntılı açıklamaları dinleyebilirsiniz. Lütfen izin vermek için Evet''e veya reddetmek için Hayır''a basın.'),
(null, 'zh-cn', null, null, 'AppPermissionsHelp', null, '%appName% 正在请求下列车辆信息和权限： %functionalGroupLabels%。您可在移动应用程序设置菜单中更改这些权限，并听取详细说明。请按“是”允许权限或按“否”拒绝。'),
(null, 'zh-tw', null, null, 'AppPermissionsHelp', null, '%appName% 正請求使用 %functionalGroupLabels% 的車輛資訊和許可。您可在行動應用程式設定清單中更改這些許可，並聆聽詳細說明。給予許可請按「是」，拒絕請按「否」。'),
(null, 'de-de', null, null, 'AppPermissionsRevoked', null, 'Die Autorisierungsdaten der App wurden geändert. %appName% hat keinen Zugriff auf %functionalGroupLabels% mehr. Installieren Sie die neueste Version der App auf Ihrem Gerät..'),
(null, 'en-au', null, null, 'AppPermissionsRevoked', null, 'App authorizations have changed. %appName% can no longer access %functionalGroupLabels%. Please ensure you have the most recent app version installed on your mobile device.'),
(null, 'en-gb', null, null, 'AppPermissionsRevoked', null, 'App authorizations have changed. %appName% can no longer access %functionalGroupLabels%. Please ensure you have the most recent app version installed on your mobile device.'),
(null, 'en-ie', null, null, 'AppPermissionsRevoked', null, 'App authorizations have changed. %appName% can no longer access %functionalGroupLabels%. Please ensure you have the most recent app version installed on your mobile device.'),
(null, 'en-us', null, null, 'AppPermissionsRevoked', null, 'App authorizations have changed. %appName% can no longer access %functionalGroupLabels%. Please ensure you have the most recent app version installed on your mobile device.'),
(null, 'es-en', null, null, 'AppPermissionsRevoked', null, 'Las autorizaciones de la aplicación han cambiado. %appName% ya no puede acceder a %functionalGroupLabels%. Asegúrese de haber instalado la versión más reciente de la aplicación en su dispositivo móvil.'),
(null, 'es-es', null, null, 'AppPermissionsRevoked', null, 'Las autorizaciones de la aplicación han cambiado. %appName% ya no puede acceder a %functionalGroupLabels%. Asegúrese de que tiene la versión más reciente de la aplicación instalada en su dispositivo móvil.'),
(null, 'es-mx', null, null, 'AppPermissionsRevoked', null, 'Las autorizaciones de la aplicación han cambiado. %appName% ya no puede acceder a %functionalGroupLabels%. Asegúrese de haber instalado la versión más reciente de la aplicación en su dispositivo móvil.'),
(null, 'fr-ca', null, null, 'AppPermissionsRevoked', null, 'Les autorisations pour app ont changé. %appName% ne peut plus accéder à %functionalGroupLabels%. Veuillez vous assurer que la plus récente version de l’application est installée sur votre appareil mobile.'),
(null, 'fr-fr', null, null, 'AppPermissionsRevoked', null, 'Les autorisations pour app ont changé. %appName% ne peut plus accéder à %functionalGroupLabels%. Veuillez vous assurer que la plus récente version de l’application est installée sur votre appareil mobile.'),
(null, 'it-it', null, null, 'AppPermissionsRevoked', null, 'Le autorizzazioni dell''app sono cambiate. %appName% non è più in grado di accedere a %functionalGroupLabels%. Assicurarsi di avere la versione più recente dell''app installata sul dispositivo mobile.'),
(null, 'nl-nl', null, null, 'AppPermissionsRevoked', null, 'De app-autorisaties zijn gewijzigd. %appName% heeft geen toegang meer tot %functionalGroupLabels%. Zorg ervoor dat u de meest recente app-versie op uw mobiele apparaat geïnstalleerd hebt.'),
(null, 'pl-pl', null, null, 'AppPermissionsRevoked', null, 'Dane dostępu aplikacji zostały zmienione. %appName% nie ma już dostępu do %functionalGroupLabels%. Sprawdź, czy na telefonie komórkowym zainstalowano najnowszą wersję aplikacji.'),
(null, 'pt-br', null, null, 'AppPermissionsRevoked', null, 'As autorizações dos aplicativos foram alteradas. %appName% não pode mais acessar %functionalGroupLabels%. Certifique-se de que a versão mais recente do aplicativo está instalada no seu dispositivo móvel.'),
(null, 'pt-pt', null, null, 'AppPermissionsRevoked', null, 'As autorizações das aplicações mudaram. %appName% já não consegue aceder a %functionalGroupLabels%. Certifique-se de que tem a última versão da aplicação no seu dispositivo móvel.'),
(null, 'ru-ru', null, null, 'AppPermissionsRevoked', null, 'Авторизации приложения изменены. %appName% больше не имеет доступа к %functionalGroupLabels%. Убедитесь, что на вашем мобильном устройстве установлена самая новая версия приложения.'),
(null, 'sv-se', null, null, 'AppPermissionsRevoked', null, 'Appens behörigheter har ändrats. %appName% har inte längre åtkomst till %functionalGroupLabels%. Kontrollera att du har installerat den senaste versionen av appen på mobilenheten.'),
(null, 'tr-tr', null, null, 'AppPermissionsRevoked', null, 'Uygulama yetkileri değişti. %appName% artık %functionalGroupLabels%''e erişemeyecek. Lütfen mobil aygıtınızda en son uygulama sürümünün yüklü olduğundan emin olun.'),
(null, 'zh-cn', null, null, 'AppPermissionsRevoked', null, '应用程序授权已变更。 %appName% 将不能再访问 %functionalGroupLabels%。 请确认您的移动设备上安装的应用程序是最新版本。'),
(null, 'zh-tw', null, null, 'AppPermissionsRevoked', null, '應用程式授權已改變。%appName% 已無法進入 %functionalGroupLabels%。請確認您的行動裝置上安裝了最新版應用程式。'),
(null, 'de-de', 'nicht autorisiert', null, 'AppUnauthorized', null, 'Diese Version von %appName% ist nicht autorisiert und wird nicht mit SDL funktionieren.'),
(null, 'en-au', 'not authorized', null, 'AppUnauthorized', null, 'This version of %appName% is not authorized and will not work with SDL.'),
(null, 'en-gb', 'not authorized', null, 'AppUnauthorized', 'This version of %appName% is not authorized and will not work with SDL.', 'This version of %appName% is not authorized and will not work with SDL.'),
(null, 'en-ie', 'not authorized', null, 'AppUnauthorized', null, 'This version of %appName% is not authorized and will not work with SDL.'),
(null, 'en-us', 'Not Authorized', null, 'AppUnauthorized', 'This version of %appName% is no longer authorized to work with AppLink. Please update to the latest version of %appName%.', 'This version of %appName% is not authorized and will not work with SDL.'),
(null, 'es-en', 'no autorizada', null, 'AppUnauthorized', 'Esta versión de %appName% no tiene autorización y no funcionará con SDL.', 'Esta versión de %appName% no tiene autorización y no funcionará con SDL.'),
(null, 'es-es', 'No autorizada', null, 'AppUnauthorized', null, 'Esta versión de %appName% no está autorizada y no funcionará con SDL.'),
(null, 'es-mx', 'no autorizada', null, 'AppUnauthorized', 'Esta versión de %appName% no tiene autorización y no funcionará con SDL.', 'Esta versión de %appName% no tiene autorización y no funcionará con SDL.'),
(null, 'fr-ca', 'non autorisée', null, 'AppUnauthorized', 'Cette version de %appName% n’est pas autorisée et ne fonctionnera pas avec SDL.', 'Cette version de %appName% n’est pas autorisée et ne fonctionnera pas avec SDL.'),
(null, 'fr-fr', 'non autorisée', null, 'AppUnauthorized', null, 'Cette version de %appName% n’est pas autorisée et ne fonctionnera pas avec SDL.'),
(null, 'it-it', 'non autorizzata', null, 'AppUnauthorized', null, 'Questa versione di %appName% non è autorizzata e non funziona con il SDL.'),
(null, 'nl-nl', 'niet geautoriseerd', null, 'AppUnauthorized', null, 'Deze versie van %appName% is niet geautoriseerd en werkt niet met SDL.'),
(null, 'pl-pl', 'brak autoryzacji', null, 'AppUnauthorized', null, 'Niniejsza wersja %appName% nie posiada autoryzacji i nie będzie działać z SDL.'),
(null, 'pt-br', 'não autorizado', null, 'AppUnauthorized', null, 'Esta versão do %appName% não tem autorização e não funcionará com o SDL.'),
(null, 'pt-pt', 'não autorizada', null, 'AppUnauthorized', null, 'Esta versão de %appName% não está autorizada e não funcionará com o SDL.'),
(null, 'ru-ru', 'не авторизировано', null, 'AppUnauthorized', null, 'Эта версия %appName% не авторизирована и не будет работать с SDL.'),
(null, 'sv-se', 'är ej godkänd', null, 'AppUnauthorized', null, 'Den här versionen av %appName% är inte godkänd och fungerar inte med SDL.'),
(null, 'tr-tr', 'için izin yok', null, 'AppUnauthorized', null, 'Bu %appName% sürümüne izin verilmediğinden SDL ile çalışamaz.'),
(null, 'zh-cn', '未得到授权', null, 'AppUnauthorized', null, '此版本的%appName% 未得到授权，无法在SDL上使用。'),
(null, 'zh-tw', '無授權', null, 'AppUnauthorized', null, '%appName% 的版本未獲得授權，將無法透過 SDL 使用。'),
(null, 'de-de', 'nicht unterstützt', null, 'AppUnsupported', null, 'Diese Version von %appName% wird von SDL nicht unterstützt.'),
(null, 'en-au', 'not supported', null, 'AppUnsupported', null, 'This version of %appName% is not supported by SDL.'),
(null, 'en-gb', 'not supported', null, 'AppUnsupported', 'This version of %appName% is not supported by SDL.', 'This version of %appName% is not supported by SDL.'),
(null, 'en-ie', 'not supported', null, 'AppUnsupported', null, 'This version of %appName% is not supported by SDL.'),
(null, 'en-us', 'Not Supported', null, 'AppUnsupported', 'Your version of %appName% is not supported by SDL.', 'This version of %appName% is not supported by SDL.'),
(null, 'es-en', 'no compatible', null, 'AppUnsupported', 'Esta versión de %appName% no es compatible con SDL.', 'Esta versión de %appName% no es compatible con SDL.'),
(null, 'es-es', 'No compatible', null, 'AppUnsupported', null, 'Esta versión de %appName% no es compatible con SDL.'),
(null, 'es-mx', 'no compatible', null, 'AppUnsupported', 'Esta versión de %appName% no es compatible con SDL.', 'Esta versión de %appName% no es compatible con SDL.'),
(null, 'fr-ca', 'incompatible', null, 'AppUnsupported', 'Cette version de %appName% n’est pas prise en charge par SDL.', 'Cette version de %appName% n’est pas prise en charge par SDL.'),
(null, 'fr-fr', 'incompatible', null, 'AppUnsupported', null, 'Cette version de %appName% n’est pas prise en charge par SDL.'),
(null, 'it-it', 'non supportata', null, 'AppUnsupported', null, 'Questa versione di %appName% non è supportata dal SDL.'),
(null, 'nl-nl', 'niet ondersteund', null, 'AppUnsupported', null, 'Deze versie van %appName% wordt niet ondersteund door SDL.'),
(null, 'pl-pl', 'aplikacja nie obsług.', null, 'AppUnsupported', null, 'Niniejsza wersja %appName% nie jest obsługiwana przez system SDL.'),
(null, 'pt-br', 'não suportado', null, 'AppUnsupported', null, 'Esta versão do %appName% não é suportada pelo SDL.'),
(null, 'pt-pt', 'não suportada', null, 'AppUnsupported', null, 'Esta versão de %appName% não é suportado pelo SDL.'),
(null, 'ru-ru', 'не поддерживается', null, 'AppUnsupported', null, 'Эта версия %appName% не поддерживается SDL.'),
(null, 'sv-se', 'stöds ej', null, 'AppUnsupported', null, 'SDL har inte stöd för den här versionen av %appName%.'),
(null, 'tr-tr', 'desteklenmiyor', null, 'AppUnsupported', null, 'Bu %appName% sürümü SDL tarafından desteklenmiyor.'),
(null, 'zh-cn', '不受支持', null, 'AppUnsupported', null, 'SDL不支持此版本的%appName%。'),
(null, 'zh-tw', '不支援', null, 'AppUnsupported', null, 'SDL 不支援此版本的%appName% 。'),
(null, 'en-gb', null, null, 'DataConsent', 'Would you like to enable Mobile Apps on SDL? To use Mobile Apps with SDL, SDL will communicate with a server at least once per month using your mobile device’s data plan. Standard rates may apply. SDL will send your VIN and SDL module number to a server.

Updates are about the size of an email, and the occurrence of updates depends on your vehicle usage and when a new app is found on your device. To turn on or off, visit the SDL Settings menu. See your Owner Guide for more information.', null),
(null, 'en-us', 'Enable Mobile Apps', 'on SDL? (Uses Data)', 'DataConsent', 'Would you like to enable Mobile Apps on SDL?

To use Mobile Apps with SDL, SDL will communicate with a server at least once per month using your mobile device’s data plan. Standard rates may apply. SDL will send your VIN and SDL module number to a server.

Updates are about the size of an email, and the occurrence of updates depends on your vehicle usage and when a new app is found on your device. To turn on or off, visit the SDL Settings menu. See your Owner Guide for more information.', null),
(null, 'es-mx', null, null, 'DataConsent', 'Para usar aplicaciones móviles con SDL, este debe comunicarse con
un servidor al menos una vez al mes a través del plan de datos de su dispositivo móvil. Pueden aplicar tarifas normales. SDL enviará su VIN y el número de módulo de SDL a
un servidor.

Las actualizaciones tienen el tamaño aproximado de un mensaje de correo electrónico, y la frecuencia de las actualizaciones depende del uso de su vehículo y de si se encuentran nuevas aplicaciones en su dispositivo. Para obtener más información, consulte la Guía del propietario.

Presione Sí para permitir y No para denegar.', null),
(null, 'fr-ca', null, null, 'DataConsent', 'Pour utiliser AppLink, SDL devra communiquer avec
un serveur au moins une fois par mois en utilisant le forfait de données de votre appareil mobile. Les tarifs réguliers peuvent s’appliquer. SDL enverra votre NIV et le numéro de votre module SDL à
un serveur. Les mises à jour ont la taille d’un courriel et la fréquence des mises à jour dépend de l’utilisation de votre véhicule et si une nouvelle application se trouve sur votre appareil. Consultez le Guide de l’utilisateur pour obtenir d’autres renseignements.

Veuillez appuyer sur Oui pour autoriser ou sur Non pour refuser.', null),
(null, 'en-us', null, null, 'DataConsentHelp', 'By enabling mobile apps, you consent to allowing SDL to communicate with a server at least once per month using your mobile device’s data plan. Disabling will stop all data usage, but you will not be able to use mobile apps on SDL. See your Owner Guide for more information.', null),
(null, 'es-mx', null, null, 'DataConsentHelp', 'Las actualizaciones tienen el tamaño aproximado de un mensaje de correo electrónico, y la frecuencia de las actualizaciones depende del uso de su vehículo y de si se encuentran nuevas aplicaciones en su dispositivo. Para obtener más información, consulte la Guía del propietario.', null),
(null, 'fr-ca', null, null, 'DataConsentHelp', 'Les mises à jour ont la taille d’un courriel et la fréquence des mises à jour dépend de l’utilisation de votre véhicule et si une nouvelle application se trouve sur votre appareil. Consultez le Guide de l’utilisateur pour obtenir d’autres renseignements.', null),
(null, 'de-de', 'Auto-Update', 'und Mobile Apps deaktivieren', 'DisableApps', null, 'Ausschalten der automatischen Updates führt zum Ausschalten von SDL mobile Apps. Sie können Ihre mobilen Apps dann nicht mehr mit SDL nutzen. Bitte drücken Sie Ja zur Bestätigung oder Nein, um abzubrechen.'),
(null, 'en-au', 'Disable auto-updates', 'and Mobile Apps?', 'DisableApps', null, 'Disabling automatic updates will also disable SDL mobile apps. You will not be able to use any mobile apps with SDL. Please press Yes to confirm or No to cancel.'),
(null, 'en-gb', 'Disable auto-updates', 'and Mobile Apps?', 'DisableApps', 'Disabling automatic updates will also disable SDL mobile apps. You will not be able to use any mobile apps with SDL. Please press Yes to confirm or No to cancel.', 'Disabling automatic updates will also disable SDL mobile apps. You will not be able to use any mobile apps with SDL. Please press Yes to confirm or No to cancel.'),
(null, 'en-ie', 'Disable auto-updates', 'and Mobile Apps?', 'DisableApps', null, 'Disabling automatic updates will also disable SDL mobile apps. You will not be able to use any mobile apps with SDL. Please press Yes to confirm or No to cancel.'),
(null, 'en-us', 'Disable Auto-Updates', 'and Mobile Apps?', 'DisableApps', 'If you disable, you will not be able to use any mobile apps with SDL and your vehicle will stop receiving mobile app permission updates via your device`s data plan. Please press yes to disable mobile apps or no to cancel.', 'Disabling automatic updates will also disable SDL mobile apps. You will not be able to use any mobile apps with SDL. Please press yes to confirm or no to cancel.'),
(null, 'es-en', '¿Deshab. actualiz.', 'autom. y aplic. móv.?', 'DisableApps', 'Si se desactivan las actualizaciones automáticas, también se desactivarán las aplicaciones móviles de SDL. No podrá usar ninguna aplicación móvil con SDL. Presione Sí para confirmar o No para cancelar.', 'Si se desactivan las actualizaciones automáticas, también se desactivarán las aplicaciones móviles de SDL. No podrá usar ninguna aplicación móvil con SDL. Presione Sí para confirmar o No para cancelar.'),
(null, 'es-es', '¿Desact. actual. auto', 'y apl. móviles?', 'DisableApps', null, 'Si desactiva las actualizaciones automáticas, también se desactivará la sincronización de las aplicaciones móviles. No podrá utilizar ninguna aplicación móvil con SDL. Pulse sí para confirmar o no para cancelar.'),
(null, 'es-mx', '¿Deshab. actualiz.', 'autom. y aplic. móv.?', 'DisableApps', 'Si se desactivan las actualizaciones automáticas, también se desactivarán las aplicaciones móviles de SDL. No podrá usar ninguna aplicación móvil con SDL. Presione Sí para confirmar o No para cancelar.', 'Si se desactivan las actualizaciones automáticas, también se desactivarán las aplicaciones móviles de SDL. No podrá usar ninguna aplicación móvil con SDL. Presione Sí para confirmar o No para cancelar.'),
(null, 'fr-ca', 'Désactiver màj autom.', 'et app. mobiles?', 'DisableApps', 'La désactivation des mises à jour automatiques désactivera aussi les applications mobiles SDL. Vous ne pourrez pas utiliser d’application mobile avec SDL. Veuillez appuyer sur Oui pour confirmer ou sur Non pour annuler.', 'La désactivation des mises à jour automatiques désactivera aussi les applications mobiles SDL. Vous ne pourrez pas utiliser d’application mobile avec SDL. Veuillez appuyer sur Oui pour confirmer ou sur Non pour annuler.'),
(null, 'fr-fr', 'Désactiver màj autom.', 'et app. mobiles?', 'DisableApps', null, 'La désactivation des mises à jour automatiques désactivera aussi les applications mobiles SDL. Vous ne pourrez pas utiliser d’application mobile avec SDL. Veuillez appuyer sur Oui pour confirmer ou sur Non pour annuler.'),
(null, 'it-it', 'Disabilitare agg. aut.', 'e app mobili?', 'DisableApps', null, 'Disabilitando gli aggiornamenti automatici si disattiva anche la sincronizzazione delle app mobili. Non sarà possibile usare app mobili con il SDL. Premere Sì per confermare e No per cancellare.'),
(null, 'nl-nl', 'Auto-updates en mob.', 'apps uitschakelen?', 'DisableApps', null, 'Door automatische updates uit te schakelen, schakelt u ook SDL-mobiele apps uit. U kunt dan geen mobiele apps meer gebruiken met SDL. Druk op Ja om te bevestigen of op Nee om te annuleren.'),
(null, 'pl-pl', 'Wył. automat. aktual.', 'i aplikacje mobilne?', 'DisableApps', null, 'Wyłączenie automatycznych aktualizacji spowoduje także wyłączenie aplikacji mobilnych SDL. Korzystanie z mobilnych aplikacji za pomocą SDL będzie niemożliwe. Naciśnij TAK, by potwierdzić lub NIE, by anulować.'),
(null, 'pt-br', 'Desativar atualizações', 'autom. e aplicativos?', 'DisableApps', null, 'Se as atualizações automáticas forem desativadas, os aplicativos também serão desativados. Você não poderá usar nenhum aplicativo com o SDL. Pressione sim para confirmar ou não para cancelar.'),
(null, 'pt-pt', 'Desact. actual. autom.', 'e aplicações móveis?', 'DisableApps', null, 'A desactivação das actualizações automáticas desactiva igualmente as aplicações móveis do SDL. Não poderá utilizar quaisquer aplicações móveis com o SDL. Prima ""Sim"" para confirmar ou ""Não"" para cancelar.'),
(null, 'ru-ru', 'Откл. автообновления', 'и мобил. прилож.?', 'DisableApps', null, 'При отключении автоматических обновлений также будут отключены мобильные приложения SDL. Вы не сможете использовать какие-либо мобильные приложения с SDL. Нажмите ""Да"" для подтверждения или ""Нет"" для отмены.'),
(null, 'sv-se', 'Avaktiverar autouppdat.', 'och mobilappar?', 'DisableApps', null, 'Om du avaktiverar automatisk uppdatering avaktiverar du även synkning av mobilappar. Du kommer inte längre att kunna använda dina mobilappar med SDL. Tryck Ja för att bekräfta eller Nej för att avbryta.'),
(null, 'tr-tr', 'Oto. güncelleme ve', 'mobil uygul. kapat?', 'DisableApps', null, 'Otomatik güncellemeleri devre dışı bırakırsanız SDL mobil uygulamalar da devre dışı kalır. SDL ile mobil uygulama kullanmanız mümkün olmaz. Lütfen onaylamak için Evet''e veya iptal etmek için Hayır''a basın.'),
(null, 'zh-cn', '是否禁用自动更新和', '移动应用程序？', 'DisableApps', null, '禁用自动更新同时也会禁用SDL移动应用程序。您将无法在 SDL 中使用任何移动应用程序。请按“是”确认或按“否”取消。'),
(null, 'zh-tw', '停用自動更新', '和行動應用程式？', 'DisableApps', null, '停用自動更新也將停用 SDL 行動應用程式。您將無法透過 SDL 使用任何行動應用程式。確認請按「是」，取消請按「否」。'),
('Fahreigenschaften', 'de-de', null, null, 'DrivingCharacteristics', null, 'Eine App hat Zugriff auf die folgenden Fahreigenschaften: Kraftstoffverbrauch, MyKey, Sicherheitsgurtstatus.'),
('Driving characteristics', 'en-au', null, null, 'DrivingCharacteristics', null, 'An app can access the following driving characteristics: Fuel consumption, MyKey, Seat belt status.'),
('Driving characteristics', 'en-gb', null, null, 'DrivingCharacteristics', 'An app can access the following driving characteristics: Fuel consumption, MyKey, Seat belt status.', 'An app can access the following driving characteristics: Fuel consumption, MyKey, Seat belt status.'),
('Driving characteristics', 'en-ie', null, null, 'DrivingCharacteristics', null, 'An app can access the following driving characteristics: Fuel consumption, MyKey, Seat belt status.'),
('Driving Characteristics', 'en-us', null, null, 'DrivingCharacteristics', 'An app can access the following driving characteristics: Fuel Consumption, MyKey, Seat Belt Status.', 'An app can access the following driving characteristics: Fuel Consumption, MyKey, Seat Belt Status.'),
('Características del manejo', 'es-en', null, null, 'DrivingCharacteristics', 'Las aplicaciones pueden acceder a las siguientes características del manejo: Consumo de combustible, MyKey, Estado del cinturón de seguridad.', 'Las aplicaciones pueden acceder a las siguientes características del manejo: Consumo de combustible, MyKey, Estado del cinturón de seguridad.'),
('Características de conducción', 'es-es', null, null, 'DrivingCharacteristics', null, 'Una aplicación puede acceder a las siguientes características de conducción: Consumo de combustible, MyKey, Estado cinturones de seguridad.'),
('Características del manejo', 'es-mx', null, null, 'DrivingCharacteristics', 'Las aplicaciones pueden acceder a las siguientes características del manejo: Consumo de combustible, MyKey, Estado del cinturón de seguridad.', 'Las aplicaciones pueden acceder a las siguientes características del manejo: Consumo de combustible, MyKey, Estado del cinturón de seguridad.'),
('Caractéristiques de conduite', 'fr-ca', null, null, 'DrivingCharacteristics', 'Une application peut accéder aux caractéristiques de conduite suivantes: Consommation de carburant, MyKey, État des ceintures de sécurité.', 'Une application peut accéder aux caractéristiques de conduite suivantes: Consommation de carburant, MyKey, État des ceintures de sécurité.'),
('Caractéristiques de conduite', 'fr-fr', null, null, 'DrivingCharacteristics', null, 'Une application peut accéder aux caractéristiques de conduite suivantes: Consommation de carburant, MyKey, État des ceintures de sécurité.'),
('Caratteristiche di guida', 'it-it', null, null, 'DrivingCharacteristics', null, 'Un''app può avere accesso alle seguenti caratteristiche di guida: Consumo carburante, MyKey, Stato cinture di sicurezza.'),
('Rijkenmerken', 'nl-nl', null, null, 'DrivingCharacteristics', null, 'Een app heeft toegang tot de volgende rijkenmerken: Brandstofverbruik, MyKey, Veiligheidsgordelstatus.'),
('Informacje dotyczące stylu jazdy', 'pl-pl', null, null, 'DrivingCharacteristics', null, 'Aplikacja może uzyskać dostęp do następujących informacji dotyczących jazdy: Zużycie paliwa, MyKey, Stan pasów bezpieczeństwa.'),
('Características de condução', 'pt-br', null, null, 'DrivingCharacteristics', null, 'Um aplicativo pode acessar as seguintes características de condução: Consumo de combustível, MyKey, Estado do cinto de segurança.'),
('Características de condução', 'pt-pt', null, null, 'DrivingCharacteristics', null, 'Uma aplicação consegue aceder às seguintes informações de condução: Consumo de combustível, MyKey, Estado dos cintos de segurança.'),
('Характеристики движения', 'ru-ru', null, null, 'DrivingCharacteristics', null, 'Приложение имеет доступ к следующим характеристикам движения: Расход топлива, MyKey, Состояние ремней безопасности.'),
('Köregenskaper', 'sv-se', null, null, 'DrivingCharacteristics', null, 'Appen kan komma åt följande köregenskaper: Bränsleförbrukning, MyKey, Bältesstatus.'),
('Sürüş karakteristikleri', 'tr-tr', null, null, 'DrivingCharacteristics', null, 'Bir uygulama şu sürüş karakteristiklerine erişebilir: Yakıt tüketimi, MyKey, Emniyet kemeri durumu.'),
('行驶特性', 'zh-cn', null, null, 'DrivingCharacteristics', null, '移动应用程序可访问下列行驶特性： 油耗, MyKey, 安全带状态'),
('駕駛特性', 'zh-tw', null, null, 'DrivingCharacteristics', null, '應用程式可存取以下駕駛特性： 油耗, MyKey, 安全帶狀態'),
('GPS und Geschwindigkeit', 'de-de', null, null, 'Location', null, 'Eine App hat Zugriff auf die GPS-Daten und die Geschwindigkeit des Fahrzeugs.'),
('GPS and speed', 'en-au', null, null, 'Location', null, 'An app can access vehicle GPS and speed.'),
('GPS and speed', 'en-gb', null, null, 'Location', 'An app can access vehicle GPS and speed.', 'An app can access vehicle GPS and speed.'),
('GPS and speed', 'en-ie', null, null, 'Location', null, 'An app can access vehicle GPS and speed.'),
('GPS and speed', 'en-us', null, null, 'Location', 'An app can access vehicle GPS and speed.', 'An app can access vehicle GPS and speed.'),
('GPS y velocidad', 'es-en', null, null, 'Location', 'Las aplicaciones pueden acceder al GPS y a la velocidad del vehículo.', 'Las aplicaciones pueden acceder al GPS y a la velocidad del vehículo.'),
('GPS y velocidad', 'es-es', null, null, 'Location', null, 'Una aplicación puede acceder al GPS y la velocidad del vehículo.'),
('GPS y velocidad', 'es-mx', null, null, 'Location', 'Las aplicaciones pueden acceder al GPS y a la velocidad del vehículo.', 'Las aplicaciones pueden acceder al GPS y a la velocidad del vehículo.'),
('GPS et vitesse', 'fr-ca', null, null, 'Location', 'Une application peut accéder au GPS et à la vitesse du véhicule.', 'Une application peut accéder au GPS et à la vitesse du véhicule.'),
('GPS et vitesse', 'fr-fr', null, null, 'Location', null, 'Une application peut accéder au GPS et à la vitesse du véhicule.'),
('GPS e velocità', 'it-it', null, null, 'Location', null, 'Un''app può avere accesso a GPS e velocità del veicolo.'),
('Gps en snelheid', 'nl-nl', null, null, 'Location', null, 'Een app heeft toegang tot gps en de snelheid van het voertuig.'),
('GPS i prędkość', 'pl-pl', null, null, 'Location', null, 'Aplikacja może uzyskać dostęp do modułu GPS i prędkości pojazdu.'),
('GPS e velocidade', 'pt-br', null, null, 'Location', null, 'Um aplicativo pode acessar o GPS e a velocidade do veículo.'),
('GPS e velocidade', 'pt-pt', null, null, 'Location', null, 'Uma aplicação consegue aceder ao GPS e à velocidade do veículo.'),
('GPS и скорость', 'ru-ru', null, null, 'Location', null, 'Приложение имеет доступ к GPS и скорости автомобиля.'),
('GPS och hastighet', 'sv-se', null, null, 'Location', null, 'Appen kan komma åt fordonets GPS och hastighetsmätare.'),
('GPS ve hız', 'tr-tr', null, null, 'Location', null, 'Bu uygulama aracın GPS ve hız bilgilerine erişebilir.'),
('GPS 和车速', 'zh-cn', null, null, 'Location', null, '移动应用程序可以访问车辆 GPS 和车速信息。'),
('GPS和車速', 'zh-tw', null, null, 'Location', null, '應用程式可存取車輛的GPS和速度。'),
('Push-Benachrichtigungen', 'de-de', null, null, 'Notifications', null, 'Läuft die App im Hintergrund, kann Sie Benachrichtigungen senden.'),
('Push notifications', 'en-au', null, null, 'Notifications', null, 'An app can send notifications when running in the background.'),
('Push notifications', 'en-gb', null, null, 'Notifications', 'An app can send notifications when running in the background.', 'An app can send notifications when running in the background.'),
('Push notifications', 'en-ie', null, null, 'Notifications', null, 'An app can send notifications when running in the background.'),
('Push notifications', 'en-us', null, null, 'Notifications', 'An app can send notifications when running in the background.', 'An app can send notifications when running in the background.'),
('Notificaciones tipo Push', 'es-en', null, null, 'Notifications', 'Las aplicaciones pueden enviar notificaciones cuando se ejecutan en segundo plano.', 'Las aplicaciones pueden enviar notificaciones cuando se ejecutan en segundo plano.'),
('Notificaciones push', 'es-es', null, null, 'Notifications', null, 'Una aplicación puede enviar notificaciones cuando se está ejecutando en segundo plano.'),
('Notificaciones tipo Push', 'es-mx', null, null, 'Notifications', 'Las aplicaciones pueden enviar notificaciones cuando se ejecutan en segundo plano.', 'Las aplicaciones pueden enviar notificaciones cuando se ejecutan en segundo plano.'),
('Notifications instantanées', 'fr-ca', null, null, 'Notifications', 'Une application peut envoyer des avis lorsqu’elle fonctionne en arrière-plan.', 'Une application peut envoyer des avis lorsqu’elle fonctionne en arrière-plan.'),
('Notifications push', 'fr-fr', null, null, 'Notifications', null, 'Une application peut envoyer des avis lorsqu’elle fonctionne en arrière-plan.'),
('Notifiche push', 'it-it', null, null, 'Notifications', null, 'Un''app può inviare notifiche se eseguita in background.'),
('Push-meldingen', 'nl-nl', null, null, 'Notifications', null, 'Een app kan meldingen versturen als deze op de achtergrond actief is.'),
('Powiadomienia Push', 'pl-pl', null, null, 'Notifications', null, 'Aplikacja może wysyłać powiadomienia, działając w tle.'),
('Notificações Push', 'pt-br', null, null, 'Notifications', null, 'Um aplicativo pode enviar notificações quando estiver sendo executado em segundo plano.'),
('Notificações push', 'pt-pt', null, null, 'Notifications', null, 'Uma aplicação consegue enviar notificações quando está activa em segundo plano.'),
('Оповещения о пересылке', 'ru-ru', null, null, 'Notifications', null, 'Если приложение работает в фоновом режиме, оно может отправлять оповещения.'),
('Push-notiser', 'sv-se', null, null, 'Notifications', null, 'Appen kan skicka meddelanden när den körs i bakgrunden.'),
('Anlık bildirimleri', 'tr-tr', null, null, 'Notifications', null, 'Bir uygulama arka planda çalışırken bildirim gönderebilir.'),
('推送通知', 'zh-cn', null, null, 'Notifications', null, '移动应用程序在后台运行时可推送通知。'),
('傳送通知', 'zh-tw', null, null, 'Notifications', null, '車輛行進時，應用程式可在背景中傳送通知。'),
(null, 'de-de', 'Updates deakt.', null, 'SettingDisableUpdates', null, null),
(null, 'en-au', 'Disable updates', null, 'SettingDisableUpdates', null, null),
(null, 'en-gb', 'Disable updates', null, 'SettingDisableUpdates', null, null),
(null, 'en-ie', 'Disable updates', null, 'SettingDisableUpdates', null, null),
(null, 'en-us', 'Disable Updates', null, 'SettingDisableUpdates', 'Disable Updates', null),
(null, 'es-en', 'Deshab. actual.', null, 'SettingDisableUpdates', 'Deshab. actual.', null),
(null, 'es-es', 'Desact. actual.', null, 'SettingDisableUpdates', null, null),
(null, 'es-mx', 'Deshab. actual.', null, 'SettingDisableUpdates', 'Deshab. actual.', null),
(null, 'fr-ca', 'Désactiver MAJ', null, 'SettingDisableUpdates', 'Désactiver MAJ', null),
(null, 'fr-fr', 'Désactiver màj', null, 'SettingDisableUpdates', null, null),
(null, 'it-it', 'Disabilita agg.', null, 'SettingDisableUpdates', null, null),
(null, 'nl-nl', 'Upd. uitschak.', null, 'SettingDisableUpdates', null, null),
(null, 'pl-pl', 'Wyłącz aktual.', null, 'SettingDisableUpdates', null, null),
(null, 'pt-br', 'Desat. atualiz.', null, 'SettingDisableUpdates', null, null),
(null, 'pt-pt', 'Desact. actualiz.', null, 'SettingDisableUpdates', null, null),
(null, 'ru-ru', 'Откл. обновл.', null, 'SettingDisableUpdates', null, null),
(null, 'sv-se', 'Inaktivera uppd.', null, 'SettingDisableUpdates', null, null),
(null, 'tr-tr', 'Güncell. Kapat', null, 'SettingDisableUpdates', null, null),
(null, 'zh-cn', '禁用更新', null, 'SettingDisableUpdates', null, null),
(null, 'zh-tw', '停用更新', null, 'SettingDisableUpdates', null, null),
(null, 'de-de', 'Apps aktivieren', null, 'SettingEnableUpdates', null, null),
(null, 'en-au', 'Enable Apps', null, 'SettingEnableUpdates', null, null),
(null, 'en-gb', 'Enable Apps', null, 'SettingEnableUpdates', null, null),
(null, 'en-ie', 'Enable Apps', null, 'SettingEnableUpdates', null, null),
(null, 'en-us', 'Enable Apps', null, 'SettingEnableUpdates', null, null),
(null, 'es-en', 'Hab. aplic.', null, 'SettingEnableUpdates', null, null),
(null, 'es-es', 'Activar apl.', null, 'SettingEnableUpdates', null, null),
(null, 'es-mx', 'Hab. aplic.', null, 'SettingEnableUpdates', null, null),
(null, 'fr-ca', 'Activer app.', null, 'SettingEnableUpdates', 'Activer app.', null),
(null, 'fr-fr', 'Activer app.', null, 'SettingEnableUpdates', null, null),
(null, 'it-it', 'Abilita app', null, 'SettingEnableUpdates', null, null),
(null, 'nl-nl', 'Apps inschak.', null, 'SettingEnableUpdates', null, null),
(null, 'pl-pl', 'Włącz aplikacje', null, 'SettingEnableUpdates', null, null),
(null, 'pt-br', 'Ativar aplic.', null, 'SettingEnableUpdates', null, null),
(null, 'pt-pt', 'Activar actualiz.', null, 'SettingEnableUpdates', null, null),
(null, 'ru-ru', 'Вкл. прилож.', null, 'SettingEnableUpdates', null, null),
(null, 'sv-se', 'Aktivera appar', null, 'SettingEnableUpdates', null, null),
(null, 'tr-tr', 'Uygulamaları aç', null, 'SettingEnableUpdates', null, null),
(null, 'zh-cn', '启用应用程序', null, 'SettingEnableUpdates', null, null),
(null, 'zh-tw', '啟用應用程式', null, 'SettingEnableUpdates', null, null),
(null, 'de-de', 'Update anford.', null, 'SettingUpdateAuto', null, null),
(null, 'en-au', 'Request update', null, 'SettingUpdateAuto', null, null),
(null, 'en-gb', 'Request update', null, 'SettingUpdateAuto', null, null),
(null, 'en-ie', 'Request update', null, 'SettingUpdateAuto', null, null),
(null, 'en-us', 'Request Update', null, 'SettingUpdateAuto', 'Select `Update now` to receive app permissions for your SDL-enabled mobile apps. This may enable additional functionality depending on the app and your settings. If your phone has a working data connection, an update should complete in less than 1 minute.', null),
(null, 'es-en', 'Solicit. actualiz.', null, 'SettingUpdateAuto', 'Solicit. actualiz.', null),
(null, 'es-es', 'Solicitar actual.', null, 'SettingUpdateAuto', null, null),
(null, 'es-mx', 'Solicit. actualiz.', null, 'SettingUpdateAuto', 'Solicit. actualiz.', null),
(null, 'fr-ca', 'Demander MAJ', null, 'SettingUpdateAuto', 'Demander MAJ', null),
(null, 'fr-fr', 'Demander màj', null, 'SettingUpdateAuto', null, null),
(null, 'it-it', 'Rich. aggiorn.', null, 'SettingUpdateAuto', null, null),
(null, 'nl-nl', 'Upd. aanvragen', null, 'SettingUpdateAuto', null, null),
(null, 'pl-pl', 'Zażądaj aktual.', null, 'SettingUpdateAuto', null, null),
(null, 'pt-br', 'Solicitar atualiz.', null, 'SettingUpdateAuto', null, null),
(null, 'pt-pt', 'Solicit. actualiz.', null, 'SettingUpdateAuto', null, null),
(null, 'ru-ru', 'Запрос на обн.', null, 'SettingUpdateAuto', null, null),
(null, 'sv-se', 'Begär uppdat.', null, 'SettingUpdateAuto', null, null),
(null, 'tr-tr', 'Güncelleme iste', null, 'SettingUpdateAuto', null, null),
(null, 'zh-cn', '请求更新', null, 'SettingUpdateAuto', null, null),
(null, 'zh-tw', '請求更新', null, 'SettingUpdateAuto', null, null),
(null, 'de-de', 'Update benötigt', null, 'StatusNeeded', null, null),
(null, 'en-au', 'Update needed', null, 'StatusNeeded', null, null),
(null, 'en-gb', 'Update needed', null, 'StatusNeeded', 'Update needed', null),
(null, 'en-ie', 'Update needed', null, 'StatusNeeded', null, null),
(null, 'en-us', 'Update Needed', null, 'StatusNeeded', 'Update Needed', null),
(null, 'es-en', 'Actualiz. neces.', null, 'StatusNeeded', 'Actualiz. neces.', null),
(null, 'es-es', 'Actu. necesaria', null, 'StatusNeeded', null, null),
(null, 'es-mx', 'Actualiz. neces.', null, 'StatusNeeded', 'Actualiz. neces.', null),
(null, 'fr-ca', 'Màj requise', null, 'StatusNeeded', 'Màj requise', null),
(null, 'fr-fr', 'Mise à jour requise', null, 'StatusNeeded', null, null),
(null, 'it-it', 'Necess. aggiorn.', null, 'StatusNeeded', null, null),
(null, 'nl-nl', 'Update nodig', null, 'StatusNeeded', null, null),
(null, 'pl-pl', 'Potrzeba aktual.', null, 'StatusNeeded', null, null),
(null, 'pt-br', 'Atualiz. necess.', null, 'StatusNeeded', null, null),
(null, 'pt-pt', 'Actual. necess.', null, 'StatusNeeded', null, null),
(null, 'ru-ru', 'Необх. обновл.', null, 'StatusNeeded', null, null),
(null, 'sv-se', 'Uppdat. krävs', null, 'StatusNeeded', null, null),
(null, 'tr-tr', 'Güncellenmeli', null, 'StatusNeeded', null, null),
(null, 'zh-cn', '需要进行更新', null, 'StatusNeeded', null, null),
(null, 'zh-tw', '需更新', null, 'StatusNeeded', null, null),
(null, 'de-de', 'Aktualisieren...', null, 'StatusPending', null, null),
(null, 'en-au', 'Updating...', null, 'StatusPending', null, null),
(null, 'en-gb', 'Updating...', null, 'StatusPending', 'Updating...', null),
(null, 'en-ie', 'Updating...', null, 'StatusPending', null, null),
(null, 'en-us', 'Updating...', null, 'StatusPending', 'Updating...', null),
(null, 'es-en', 'Actualizando...', null, 'StatusPending', 'Actualizando...', null),
(null, 'es-es', 'Actualizando...', null, 'StatusPending', null, null),
(null, 'es-mx', 'Actualizando...', null, 'StatusPending', 'Actualizando...', null),
(null, 'fr-ca', 'MAJ en cours...', null, 'StatusPending', 'MAJ en cours...', null),
(null, 'fr-fr', 'Màj en cours...', null, 'StatusPending', null, null),
(null, 'it-it', 'Aggiornamento', null, 'StatusPending', null, null),
(null, 'nl-nl', 'Updaten...', null, 'StatusPending', null, null),
(null, 'pl-pl', 'Aktualizowanie', null, 'StatusPending', null, null),
(null, 'pt-br', 'Atualizando...', null, 'StatusPending', null, null),
(null, 'pt-pt', 'A actualizar...', null, 'StatusPending', null, null),
(null, 'ru-ru', 'Обновление...', null, 'StatusPending', null, null),
(null, 'sv-se', 'Uppdaterar...', null, 'StatusPending', null, null),
(null, 'tr-tr', 'Güncelleniyor...', null, 'StatusPending', null, null),
(null, 'zh-cn', '正在更新......', null, 'StatusPending', null, null),
(null, 'zh-tw', '更新中...', null, 'StatusPending', null, null),
(null, 'de-de', 'Aktuelle Version', null, 'StatusUpToDate', null, null),
(null, 'en-au', 'Up-to-date', null, 'StatusUpToDate', null, null),
(null, 'en-gb', 'Up-to-date', null, 'StatusUpToDate', 'Up-to-date', null),
(null, 'en-ie', 'Up-to-date', null, 'StatusUpToDate', null, null),
(null, 'en-us', 'Up-To-Date', null, 'StatusUpToDate', 'Up-To-Date', null),
(null, 'es-en', 'Actualizado', null, 'StatusUpToDate', 'Actualizado', null),
(null, 'es-es', 'Actualizada', null, 'StatusUpToDate', null, null),
(null, 'es-mx', 'Actualizado', null, 'StatusUpToDate', 'Actualizado', null),
(null, 'fr-ca', 'Déjà à jour', null, 'StatusUpToDate', 'Déjà à jour', null),
(null, 'fr-fr', 'Déjà à jour', null, 'StatusUpToDate', null, null),
(null, 'it-it', 'più recente', null, 'StatusUpToDate', null, null),
(null, 'nl-nl', 'Up-to-date', null, 'StatusUpToDate', null, null),
(null, 'pl-pl', 'Aktualne', null, 'StatusUpToDate', null, null),
(null, 'pt-br', 'Atualizado', null, 'StatusUpToDate', null, null),
(null, 'pt-pt', 'Actualizado', null, 'StatusUpToDate', null, null),
(null, 'ru-ru', 'Обновлено', null, 'StatusUpToDate', null, null),
(null, 'sv-se', 'Uppdat. krävs ej', null, 'StatusUpToDate', null, null),
(null, 'tr-tr', 'Güncel', null, 'StatusUpToDate', null, null),
(null, 'zh-cn', '最新更新', null, 'StatusUpToDate', null, null),
(null, 'zh-tw', '更新最新', null, 'StatusUpToDate', null, null),
('Fahrzeuginformationen', 'de-de', null, null, 'VehicleInfo', null, 'Eine App hat Zugriff auf die folgenden Fahrzeuginformationen: Kraftstoff-Füllstand, Kraftstoffverbrauch, Motordrehzahl, Kilometerzähler, FIN, Außentemperatur, Gangstellung, Reifenluftdruck.'),
('Vehicle information', 'en-au', null, null, 'VehicleInfo', null, 'An app can access the following vehicle information: Fuel level, Fuel economy, Engine RPMs, Odometer, VIN, Outside air temperature, Gear position, Tyre pressure.'),
('Vehicle information', 'en-gb', null, null, 'VehicleInfo', 'An app can access the following vehicle information: Fuel level, Fuel economy, Engine RPMs, Odometer, VIN, Outside air temperature, Gear position, Tire pressure.', 'An app can access the following vehicle information: Fuel level, Fuel economy, Engine RPMs, Odometer, VIN, Outside air temperature, Gear position, Tire pressure.'),
('Vehicle information', 'en-ie', null, null, 'VehicleInfo', null, 'An app can access the following vehicle information: Fuel level, Fuel economy, Engine RPMs, Odometer, VIN, Outside air temperature, Gear position, Tyre pressure.'),
('Vehicle information', 'en-us', null, null, 'VehicleInfo', 'An app can access the following vehicle information: Fuel Level, Fuel Economy, Engine RPMs, Odometer, VIN, External Temperature, Gear Position, Tire Pressure.', 'An app can access the following vehicle information: Fuel Level, Fuel Economy, Engine RPMs, Odometer, VIN, External Temperature, Gear Position, Tire Pressure.'),
('Información del vehículo', 'es-en', null, null, 'VehicleInfo', 'Las aplicaciones pueden acceder a la siguiente información del vehículo: Nivel de combustible, Economía de combustible, RPM del motor, Cuentakilómetros, Número de identificación del vehículo, Temperatura externa, Posición del cambio, Presión de los neumáticos.', 'Las aplicaciones pueden acceder a la siguiente información del vehículo: Nivel de combustible, Economía de combustible, RPM del motor, Cuentakilómetros, Número de identificación del vehículo, Temperatura externa, Posición del cambio, Presión de los neumáticos.'),
('Información del vehículo', 'es-es', null, null, 'VehicleInfo', null, 'Una aplicación puede acceder a la siguiente información del vehículo: Nivel de combustible, Ahorro de combustible, RPM del motor, Cuentakilómetros, VIN, Temperatura aire exterior, Marcha engranada, Presión de neumáticos.'),
('Información del vehículo', 'es-mx', null, null, 'VehicleInfo', 'Las aplicaciones pueden acceder a la siguiente información del vehículo: Nivel de combustible, Economía de combustible, RPM del motor, Cuentakilómetros, Número de identificación del vehículo, Temperatura externa, Posición del cambio, Presión de los neumáticos.', 'Las aplicaciones pueden acceder a la siguiente información del vehículo: Nivel de combustible, Economía de combustible, RPM del motor, Cuentakilómetros, Número de identificación del vehículo, Temperatura externa, Posición del cambio, Presión de los neumáticos.'),
('Renseignements du véhicule', 'fr-ca', null, null, 'VehicleInfo', 'Une application peut accéder aux informations suivantes du véhicule: Niveau de carburant, Économie de carburant, Au régime du moteur, Odomètre, NIV, Température extérieure, Position d’embrayage, Pression des pneus.', 'Une application peut accéder aux informations suivantes du véhicule: Niveau de carburant, Économie de carburant, Au régime du moteur, Odomètre, NIV, Température extérieure, Position d’embrayage, Pression des pneus.'),
('Renseignements du véhicule', 'fr-fr', null, null, 'VehicleInfo', null, 'Une application peut accéder aux informations suivantes du véhicule: Niveau de carburant, Économie de carburant, Vitesse de moteur, Compteur kilométrique, NIV, Température extérieure, Position de vitesse, Pression des pneus.'),
('Informazioni sul veicolo', 'it-it', null, null, 'VehicleInfo', null, 'Un''app può avere accesso alle seguenti informazioni del veicolo: Livello carburante, Consumi carburante, Numero giri motore, Contachilometri, VIN, Temperatura esterna, Posizione marcia, Pressione pneumatici.'),
('Voertuiginformatie', 'nl-nl', null, null, 'VehicleInfo', null, 'Een app heeft toegang tot de volgende voertuiginformatie: Brandstofpeil, Brandstofverbruik, Motortoerental, Kilometerteller, VIN, Buitentemperatuur, Versnellingsstand, Bandenspanning.'),
('Informacje o pojeździe', 'pl-pl', null, null, 'VehicleInfo', null, 'Aplikacja może uzyskać dostęp do następujących informacji o pojeździe: Poziom paliwa, Zużycie paliwa, Obroty silnika, Licznik przebiegu, Numer VIN, Temperatura zewnętrzna, Aktualny bieg, Ciśnienie opon.'),
('Informações sobre o veículo', 'pt-br', null, null, 'VehicleInfo', null, 'Um aplicativo pode acessar as seguintes informações sobre o veículo: Nível de combustível, Economia de combustível, RPM do motor, Hodômetro, VIN, Temperatura externa, Posição das marchas, Pressão dos pneus.'),
('Informações do veículo', 'pt-pt', null, null, 'VehicleInfo', null, 'Uma aplicação consegue aceder às seguintes informações do veículo: Nível de combustível, Poupança de combustível, RPM do motor, Conta-quilómetros, VIN, Temperatura exterior, Posição da mudança de velocidade, Pressão dos pneus.'),
('Информация об автомобиле', 'ru-ru', null, null, 'VehicleInfo', null, 'Приложение имеет доступ к следующим данным автомобиля: Уровень топлива, Економия топлива, Число оборотов двигателя, Одометр, Номер VIN, Температура за бортом, Положение передачи, Давление шин.'),
('Fordonsinformation', 'sv-se', null, null, 'VehicleInfo', null, 'Appen kan komma åt följande fordonsinformation: Bränslenivå, Bränsleekonomi, Motorns varvtal, Vägmätare, VIN, Utetemperatur, Växelläge, Däcktryck.'),
('Araç bilgisi', 'tr-tr', null, null, 'VehicleInfo', null, 'Bir uygulama şu araç bilgilerine erişebilir: Yakıt seviyesi, Yakıt ekonomisi, Motor devirleri, Kilometre sayacı, VIN, Dış sıcaklık, Vites konumu, Lastik basıncı.'),
('车辆信息', 'zh-cn', null, null, 'VehicleInfo', null, '移动应用程序可访问下列车辆信息 ： 燃油量, 燃油经济性, 发动机转速(RPM), 里程表, VIN, 车外温度, 档位, 胎压.'),
('車輛資訊', 'zh-tw', null, null, 'VehicleInfo', null, '一個應用程式可存取以下車輛資訊 : 燃油存量, 燃油經濟性, 引擎轉速, 里程表, 車輛識別號碼, 車外溫度, 檔位, 胎壓.');