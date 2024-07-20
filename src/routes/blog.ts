import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { createBlogInput, updateBlogInput } from "@100xdevs/medium-common";

export const blogRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    Jwt_secret: string;
  };
  Variables: {
    userId: string;
  };
}>();

blogRouter.post("/create", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());
  try {
    const userId = c.get("userId");

    const body = await c.req.json();
    const { success } = createBlogInput.safeParse(body);

    if (!success) {
      return c.json({
        message: "incorrect content",
      });
    }

    const blog = await prisma.post.create({
      data: {
        title: body.title,
        content: body.content,
        authorId: userId,
      },
    });
    return c.json({
      message: "succesfully created blog",
      blogId: blog.id,
    });
  } catch (err) {
    console.log(err);
    return c.json({
      message: "Errror while creating blog ",
    });
  }
});


blogRouter.get("/bulk", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const blog = await prisma.post.findMany(
      {
        select : {
          title : true,
          content : true,
          id : true,
          author :{
            select :{
              name : true
            }
          }
        }
      }
    );
    return c.json({
      blog: blog,
    });
  } catch (err) {
    return c.json({
      message: "Errror while listing blog ",
    });
  }
});



blogRouter.put("/:id", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const blogId = Number(c.req.param("id"));
    const body = await c.req.json();
   
    // const { success} = updateBlogInput.safeParse(body)

    // if (!success){
    //   return c.json({
    //     message : "incorrect content"
    //   })
    // }

    // if (!blogId || typeof blogId !== 'string') {
    //   return c.json({ message: "Invalid blog ID" }, 400);
    // }

    // First, check if the post exists
    const existingPost = await prisma.post.findUnique({
      where: { id: blogId },
    });

    if (!existingPost) {
      return c.json({ message: "Blog post not found" }, 404);
    }

    // If the post exists, proceed with the update
    const updatedBlog = await prisma.post.update({
      where: { id: blogId },
      data: {
        title: body.title,
        content: body.content,
      },
    });

    return c.json({
      message: "Successfully updated blog",
      blog: updatedBlog,
    });
  } catch (err) {
    console.error(err);
    return c.json(
      {
        message: "Error while updating blog",
        error: err.message,
      },
      500,
    );
  }
});


blogRouter.get("/Find/:id", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());
  try {
    const blogId = Number(c.req.param("id"));
    if(!blogId){
      return c.json({
        message : "provide correct id"
      })
    }
    console.log("hello")
    const Blog = await prisma.post.findUnique({
      where : {
        id : blogId
      },
      select :{
        title : true ,
        content : true ,
        author : {
          select : {
            name : true
          }
        }
        
      }
     
    })

     if(Blog){
       return c.json({
         blog : Blog
       })
     }

   
  } catch (err) {
    
    return c.json({
      message: "Errror while fetching blog ",
      error: err
    });
  }
});
