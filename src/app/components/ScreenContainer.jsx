import { cloneElement } from "react";
import { IconFilesOff, IconAlertTriangle } from "@tabler/icons-react";

import {
  Text,
  Loader,
  Stack,
  useMantineTheme,
  useMantineColorScheme,
  Title,
  Button,
  Card,
} from "@mantine/core";

const Wrapper = ({ children, backgroundColor, className, styleProps }) => (
  <Stack
    gap="xs"
    mih="17rem"
    align="center"
    justify="center"
    component={Card}
    shadow="none"
    bg={backgroundColor}
    radius="0"
    className={`${className}`}
    {...styleProps}
  >
    {children}
  </Stack>
);

const ScreenContainer = ({
  children,
  onError,
  onLoading,
  onEmptyData,
  onEmptyFiltersData,
  className = "",
  styleProps = {},
}) => {
  const { colors } = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();

  const titleColor = colorScheme === "dark" ? colors.dark[2] : colors.gray[7];
  const textColor = colorScheme === "dark" ? colors.dark[2] : colors.gray[6];
  const backgroundColor =
    colorScheme === "dark" ? colors.dark[7] : colors.gray[0];

  if (onLoading?.show) {
    return (
      onLoading.children ?? (
        <Wrapper
          styleProps={styleProps}
          className={`${className}`}
          backgroundColor={backgroundColor}
        >
          <Loader />
          <Text c={textColor} size="sm" ta="center" maw="50ch">
            {onLoading.description ?? "Cargando..."}
          </Text>
        </Wrapper>
      )
    );
  }

  if (onError?.show) {
    return (
      onError.children ?? (
        <Wrapper
          styleProps={styleProps}
          className={`${className}`}
          backgroundColor={backgroundColor}
        >
          <IconAlertTriangle color={titleColor} size={50} />

          <Stack gap="0" align="center" justify="center">
            <Title c={titleColor} order={5}>
              {onError.title ?? "Oops"}
            </Title>
            <Text c={textColor} size="sm" ta="center" maw="50ch">
              {onError.description ?? "Parece ser que ocurrió un error"}
            </Text>
          </Stack>

          {onError.onClick && (
            <Button variant="subtle" onClick={onError.onClick}>
              Reintentar
            </Button>
          )}
        </Wrapper>
      )
    );
  }

  if (onEmptyData?.show) {
    return (
      onEmptyData.children ?? (
        <Wrapper
          styleProps={styleProps}
          className={`${className}`}
          backgroundColor={backgroundColor}
        >
          {onEmptyData.icon ? (
            cloneElement(onEmptyData.icon, { color: titleColor })
          ) : (
            <IconFilesOff color={titleColor} size={50} />
          )}

          <Stack gap="0" align="center" justify="center">
            <Title c={titleColor} order={5}>
              {onEmptyData.title ?? "Sin datos"}
            </Title>
            <Text c={textColor} size="sm" ta="center" maw="50ch">
              {onEmptyData.description ??
                "Parece ser que no hay información que mostrar"}
            </Text>
          </Stack>
        </Wrapper>
      )
    );
  }

  if (onEmptyFiltersData?.show) {
    return (
      onEmptyFiltersData.children ?? (
        <Wrapper
          styleProps={styleProps}
          className={`${className}`}
          backgroundColor={backgroundColor}
        >
          <IconFilesOff color={titleColor} size={50} />

          <Stack gap="0" align="center" justify="center">
            <Title c={titleColor} order={5}>
              {onEmptyFiltersData.title ?? "Sin datos"}
            </Title>
            <Text c={textColor} size="sm" ta="center" maw="50ch">
              {onEmptyFiltersData.description ??
                "Parece ser que no hay información que mostrar con estos filtros"}
            </Text>
          </Stack>
        </Wrapper>
      )
    );
  }

  return children;
};

export default ScreenContainer;
