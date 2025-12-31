import {
  Accordion,
  Badge,
  Divider,
  Group,
  SimpleGrid,
  Stack,
} from "@mantine/core";

import ITEMS from "./items.jsx";
import HomeItem from "./components/HomeItem.jsx";

const HomePage = () => {
  return (
    <Stack maw="1440px" m="auto" p="lg">
      <Accordion
        multiple
        variant="default"
        defaultValue={ITEMS.map((item) => item.title)}
      >
        {ITEMS.map(({ title, options }) => (
          <Accordion.Item bd="none" key={title} value={title}>
            <Accordion.Control>
              <Group>
                <Badge style={{ cursor: "pointer" }} variant="default">
                  {title}
                </Badge>
                <Divider flex="1" mr="lg" />
              </Group>
            </Accordion.Control>
            <Accordion.Panel>
              <SimpleGrid cols={5} spacing="lg">
                {options.map((option) => (
                  <HomeItem key={option.tilte} {...option} />
                ))}
              </SimpleGrid>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    </Stack>
  );
};

export default HomePage;
